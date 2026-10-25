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
		if (!$user || !password_verify($password, $user['password_hash'])) {
			$this->api->respond_error('Invalid email or password', 401);
		}
		if (!$user['is_active']) {
			$this->api->respond_error('This account is disabled', 403);
		}

		$this->User_model->update($user['user_id'], ['last_login_at' => date('Y-m-d H:i:s')]);
		$this->respond_with_tokens($this->User_model->find($user['user_id']));
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

	private function respond_with_tokens($user)
	{
		$tokens = $this->api->issue_tokens(['id' => $user['user_id'], 'role' => $user['role']]);
		$this->api->respond(['data' => $tokens + ['user' => $this->public_user($user)]]);
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
