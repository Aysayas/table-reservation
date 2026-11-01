<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Auth extends Controller {
	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model('User_model');
	}

	public function login()
	{
		$this->api->rate_limit('login_' . $this->api->client_ip(), 10, 60);

		$input = $this->input();
		$_POST = $input;
		$this->call->library('form_validation');

		$valid = $this->form_validation->validate([
			'email' => 'required|valid_email',
			'password' => 'required',
		]);
		if (!$valid || !is_string($input['email']) || !is_string($input['password'])) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $this->form_validation->get_errors() ?? []], 422);
		}

		$email = trim($input['email']);
		$password = $input['password'];

		$user = $this->User_model->find_by('email', $email);
		if (!$user || $user['role'] === 'customer' || !password_verify($password, $user['password_hash'])) {
			$this->api->respond_error('Invalid email or password', 401);
		}
		if (!$user['is_active']) {
			$this->api->respond_error('This account is disabled', 403);
		}

		$this->User_model->update($user['user_id'], ['last_login_at' => date('Y-m-d H:i:s')]);
		$this->respond_with_tokens($this->User_model->find($user['user_id']));
	}

	public function register()
	{
		$this->api->rate_limit('register_' . $this->api->client_ip(), 10, 60);

		$input = $this->input();
		$name = is_string($input['full_name'] ?? null) ? trim($input['full_name']) : '';
		$mobile = is_string($input['mobile_number'] ?? null) ? $input['mobile_number'] : '';
		$email = is_string($input['email'] ?? null) ? strtolower(trim($input['email'])) : '';
		$password = $input['password'] ?? null;

		$errors = [];
		if ($name === '' || mb_strlen($name) > 100) {
			$errors[] = '"full_name" is required, up to 100 characters.';
		}
		if (!preg_match('/^09\d{9}$/', $mobile)) {
			$errors[] = '"mobile_number" must be 11 digits starting with 09.';
		} elseif ($this->User_model->find_by('mobile_number', $mobile)) {
			$errors[] = 'An account with that mobile number already exists.';
		}
		if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 100) {
			$errors[] = '"email" must be a valid email, up to 100 characters.';
		} elseif ($this->User_model->find_by('email', $email)) {
			$errors[] = 'An account with that email already exists.';
		}
		if (!is_string($password) || strlen($password) < 8 || strlen($password) > 72) {
			$errors[] = '"password" must be 8 to 72 characters.';
		}
		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		try {
			$id = $this->User_model->insert([
				'full_name' => $name,
				'email' => $email,
				'mobile_number' => $mobile,
				'password_hash' => password_hash($password, PASSWORD_DEFAULT),
				'role' => 'customer',
				'is_active' => 1,
				'last_login_at' => date('Y-m-d H:i:s'),
			]);
		} catch (Throwable $e) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['An account with those details already exists.']], 422);
		}

		$this->respond_with_tokens($this->User_model->find($id), 201);
	}

	public function customer_login()
	{
		$this->api->rate_limit('login_' . $this->api->client_ip(), 10, 60);

		$input = $this->input();
		$mobile = $input['mobile_number'] ?? null;
		$password = $input['password'] ?? null;
		if (!is_string($mobile) || !is_string($password) || $mobile === '' || $password === '') {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['"mobile_number" and "password" are required.']], 422);
		}

		$user = $this->User_model->find_by('mobile_number', $mobile);
		if (!$user || $user['role'] !== 'customer' || !password_verify($password, $user['password_hash'])) {
			$this->api->respond_error('Invalid mobile number or password', 401);
		}
		if (!$user['is_active']) {
			$this->api->respond_error('This account is disabled', 403);
		}

		$this->User_model->update($user['user_id'], ['last_login_at' => date('Y-m-d H:i:s')]);
		$this->respond_with_tokens($this->User_model->find($user['user_id']));
	}

	public function update_profile()
	{
		$payload = $this->api->require_role('customer');
		$this->api->rate_limit('profile_' . $payload['sub'], 10, 60);
		$user = $this->User_model->find($payload['sub']);
		if (!$user || !$user['is_active']) {
			$this->api->respond_error('Unauthorized', 401);
		}

		$input = $this->input();
		$name = is_string($input['full_name'] ?? null) ? trim($input['full_name']) : '';
		$mobile = is_string($input['mobile_number'] ?? null) ? $input['mobile_number'] : '';
		$email = is_string($input['email'] ?? null) ? strtolower(trim($input['email'])) : '';
		$password = $input['current_password'] ?? null;

		$errors = [];
		if ($name === '' || mb_strlen($name) > 100) {
			$errors[] = '"full_name" is required, up to 100 characters.';
		}
		if (!preg_match('/^09\d{9}$/', $mobile)) {
			$errors[] = '"mobile_number" must be 11 digits starting with 09.';
		} elseif ($mobile !== $user['mobile_number'] && $this->User_model->find_by('mobile_number', $mobile)) {
			$errors[] = 'An account with that mobile number already exists.';
		}
		if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 100) {
			$errors[] = '"email" must be a valid email, up to 100 characters.';
		} elseif ($email !== $user['email'] && $this->User_model->find_by('email', $email)) {
			$errors[] = 'An account with that email already exists.';
		}
		$contact_changed = $mobile !== $user['mobile_number'] || $email !== $user['email'];
		if ($contact_changed && (!is_string($password) || !password_verify($password, $user['password_hash']))) {
			$errors[] = 'Your current password is wrong.';
		}
		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		$changes = ['full_name' => $name, 'mobile_number' => $mobile, 'email' => $email];
		try {
			$this->User_model->update($user['user_id'], $changes);
		} catch (Throwable $e) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['An account with those details already exists.']], 422);
		}
		$this->call->model('Customer_model');
		$customer = $this->Customer_model->find_by('user_id', $user['user_id']);
		if ($customer) {
			$this->Customer_model->update($customer['customer_id'], $changes);
		}

		$this->api->respond(['data' => $this->public_user($this->User_model->find($user['user_id']))]);
	}

	public function forgot_password()
	{
		$this->api->rate_limit('forgot_' . $this->api->client_ip(), 5, 60);

		$email = $this->input()['email'] ?? null;
		if (!is_string($email) || !filter_var(trim($email), FILTER_VALIDATE_EMAIL)) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['"email" must be a valid email.']], 422);
		}

		$user = $this->User_model->find_by('email', strtolower(trim($email)));
		if ($user && $user['role'] === 'customer' && $user['is_active']) {
			$token = bin2hex(random_bytes(32));
			$this->db->raw(
				'REPLACE INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
				[$user['user_id'], hash('sha256', $token), date('Y-m-d H:i:s', time() + 3600)]
			);
			$this->call->library('mailer');
			$this->mailer->password_reset($user['email'], $user['full_name'], $token);
		}

		$this->api->respond(['data' => ['message' => 'If that email has an account, we sent a reset link.']]);
	}

	public function reset_password()
	{
		$this->api->rate_limit('reset_' . $this->api->client_ip(), 10, 60);

		$input = $this->input();
		$token = $input['token'] ?? null;
		$password = $input['password'] ?? null;
		if (!is_string($password) || strlen($password) < 8 || strlen($password) > 72) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => ['"password" must be 8 to 72 characters.']], 422);
		}

		$reset = is_string($token) && $token !== ''
			? $this->db->raw('SELECT user_id, expires_at FROM password_resets WHERE token_hash = ?', [hash('sha256', $token)])->fetch(PDO::FETCH_ASSOC)
			: null;
		if (!$reset || strtotime($reset['expires_at']) < time()) {
			$this->api->respond_error('This reset link is invalid or has expired', 400);
		}

		$this->db->raw('DELETE FROM password_resets WHERE user_id = ?', [$reset['user_id']]);
		$this->User_model->update($reset['user_id'], ['password_hash' => password_hash($password, PASSWORD_DEFAULT)]);
		$this->api->revoke_user_refresh_tokens($reset['user_id']);
		$this->api->respond(['data' => ['message' => 'Your password was changed']]);
	}

	public function refresh()
	{
		$payload = $this->api->consume_refresh_token($this->refresh_token());
		$user = $payload ? $this->User_model->find($payload['sub']) : null;

		if (!$user || !$user['is_active']) {
			$this->api->respond_error('Refresh token expired or revoked', 401);
		}

		$this->respond_with_tokens($user);
	}

	public function logout()
	{
		$this->api->require_jwt();
		$this->api->revoke_refresh_token($this->refresh_token());
		$this->api->respond(['data' => ['message' => 'Logged out']]);
	}

	public function me()
	{
		$payload = $this->api->require_jwt();
		$user = $this->User_model->find($payload['sub']);

		if (!$user || !$user['is_active']) {
			$this->api->respond_error('Unauthorized', 401);
		}

		$this->api->respond(['data' => $this->public_user($user)]);
	}

	private function respond_with_tokens($user, $code = 200)
	{
		$tokens = $this->api->issue_tokens(['id' => $user['user_id'], 'role' => $user['role']]);
		$this->api->respond(['data' => $tokens + ['user' => $this->public_user($user)]], $code);
	}

	private function refresh_token()
	{
		$token = $this->input()['refresh_token'] ?? null;
		if (!is_string($token) || $token === '') {
			$this->api->respond_error('refresh_token is required', 422);
		}
		return $token;
	}

	private function input()
	{
		$input = $this->request->json();
		return is_array($input) ? $input : [];
	}

	private function public_user($user)
	{
		unset($user['password_hash']);
		$user['user_id'] = (int) $user['user_id'];
		$user['is_active'] = (bool) $user['is_active'];
		return $user;
	}
}
?>
