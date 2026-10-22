<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Users extends Controller {
	private $roles = ['admin', 'staff', 'kitchen'];

	public function __construct()
	{
		parent::__construct();
		$this->call->library('api');
		$this->call->database();
		$this->call->model(['User_model', 'Payment_model']);
	}

	public function index()
	{
		$this->api->require_role('admin');
		$query = $this->api->get_query_params();
		$role = $query['role'] ?? '';
		$status = $query['status'] ?? '';
		$search = is_string($query['search'] ?? null) ? trim($query['search']) : '';

		if (($role !== '' && !in_array($role, $this->roles, true)) || ($status !== '' && !in_array($status, ['active', 'disabled'], true))) {
			$this->api->respond_error('"role" must be one of ' . implode(', ', $this->roles) . ', and "status" active or disabled', 422);
		}

		$users = $this->User_model->query();
		if ($role !== '') {
			$users->where('role', $role);
		}
		if ($status !== '') {
			$users->where('is_active', $status === 'active' ? 1 : 0);
		}
		if ($search !== '') {
			$users->grouped(function ($group) use ($search) {
				$group->like('full_name', "%{$search}%")->or_like('email', "%{$search}%");
			});
		}

		$this->api->respond(['data' => array_map([$this, 'format'], $users->order_by('full_name')->get_all())]);
	}

	public function store()
	{
		$this->api->require_role('admin');
		$input = $this->validate(null, true);

		$id = $this->User_model->insert([
			'full_name' => $input['full_name'],
			'email' => $input['email'],
			'role' => $input['role'],
			'password_hash' => password_hash($input['password'], PASSWORD_DEFAULT),
			'is_active' => 1,
		]);
		$this->api->respond(['data' => $this->format($this->User_model->find($id))], 201);
	}

	public function update($id)
	{
		$me = $this->api->require_role('admin');
		$user = $this->User_model->find($id);
		if (!$user) {
			$this->api->respond_error('User not found', 404);
		}

		$input = $this->validate((int) $id, false);
		$is_me = (int) $id === (int) $me['sub'];
		$active = $input['is_active'] ?? (bool) $user['is_active'];

		if ($is_me && $input['role'] !== $user['role']) {
			$this->api->respond_error("You can't change your own role", 409);
		}
		if ($is_me && !$active) {
			$this->api->respond_error("You can't disable your own account", 409);
		}
		if ($user['role'] === 'admin' && $user['is_active'] && ($input['role'] !== 'admin' || !$active) && $this->active_admins() <= 1) {
			$this->api->respond_error('This is the last active admin', 409);
		}

		$data = [
			'full_name' => $input['full_name'],
			'email' => $input['email'],
			'role' => $input['role'],
			'is_active' => (int) $active,
		];
		if ($input['password'] !== null) {
			$data['password_hash'] = password_hash($input['password'], PASSWORD_DEFAULT);
		}

		$this->User_model->update($id, $data);
		if ($input['password'] !== null || !$active || $input['role'] !== $user['role']) {
			$this->api->revoke_user_refresh_tokens((int) $id);
		}
		$this->api->respond(['data' => $this->format($this->User_model->find($id))]);
	}

	public function destroy($id)
	{
		$me = $this->api->require_role('admin');
		$user = $this->User_model->find($id);
		if (!$user) {
			$this->api->respond_error('User not found', 404);
		}
		if ((int) $id === (int) $me['sub']) {
			$this->api->respond_error("You can't delete your own account", 409);
		}
		if ($user['role'] === 'admin' && $user['is_active'] && $this->active_admins() <= 1) {
			$this->api->respond_error('This is the last active admin', 409);
		}
		if ($this->Payment_model->exists(['received_by' => $id])) {
			$this->api->respond_error('This account has recorded payments; disable it instead', 409);
		}

		$this->User_model->delete($id);
		$this->api->respond(['data' => ['message' => 'Deleted']]);
	}

	private function validate($except_id, $password_required)
	{
		$input = $this->api->body();
		$name = is_string($input['full_name'] ?? null) ? trim($input['full_name']) : '';
		$email = is_string($input['email'] ?? null) ? strtolower(trim($input['email'])) : '';
		$role = $input['role'] ?? null;
		$password = $input['password'] ?? null;

		$errors = [];
		if ($name === '' || mb_strlen($name) > 100) {
			$errors[] = '"full_name" is required, up to 100 characters.';
		}
		if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 100) {
			$errors[] = '"email" must be a valid email, up to 100 characters.';
		} else {
			$query = $this->User_model->filter(['email' => $email]);
			if ($except_id !== null) {
				$query->not_where('user_id', $except_id);
			}
			if ($query->count()) {
				$errors[] = 'An account with that email already exists.';
			}
		}
		if (!in_array($role, $this->roles, true)) {
			$errors[] = '"role" must be one of ' . implode(', ', $this->roles) . '.';
		}
		if ($password !== null || $password_required) {
			if (!is_string($password) || strlen($password) < 8 || strlen($password) > 72) {
				$errors[] = '"password" must be 8 to 72 characters.';
			}
		}
		if (array_key_exists('is_active', $input) && !is_bool($input['is_active'])) {
			$errors[] = '"is_active" must be true or false.';
		}
		if ($errors) {
			$this->api->respond(['error' => 'Invalid input', 'status' => 422, 'errors' => $errors], 422);
		}

		return [
			'full_name' => $name,
			'email' => $email,
			'role' => $role,
			'password' => $password,
			'is_active' => $input['is_active'] ?? null,
		];
	}

	private function active_admins()
	{
		return (int) $this->User_model->filter(['role' => 'admin', 'is_active' => 1])->count();
	}

	private function format($user)
	{
		unset($user['password_hash']);
		$user['user_id'] = (int) $user['user_id'];
		$user['is_active'] = (bool) $user['is_active'];
		return $user;
	}
}
?>
