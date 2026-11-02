<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Expiry {
	private $_lava;

	public function __construct()
	{
		$this->_lava = lava_instance();
		$this->_lava->call->model(['Reservation_model', 'Table_model', 'Payment_model']);
	}

	public function run()
	{
		$expired = 0;
		try {
			foreach ($this->_lava->Reservation_model->overdue_unpaid() as $reservation) {
				$id = (int) $reservation['reservation_id'];
				if (!$this->_lava->Reservation_model->update_where(['reservation_id' => $id, 'status' => 'pending'], ['status' => 'cancelled'])) {
					continue;
				}
				if ($reservation['table_id'] !== null) {
					$this->_lava->Table_model->update_where(['table_id' => $reservation['table_id'], 'status' => 'reserved'], ['status' => 'available']);
				}
				$this->_lava->call->library('paymongo');
				$this->_lava->paymongo->cancel_pending('reservation_id', $id);
				$this->_lava->call->library('sms');
				$this->_lava->sms->reservation($id, 'cancelled');
				$expired++;
			}
		} catch (Throwable $e) {
			error_log('Expiring unpaid reservations failed: ' . $e->getMessage());
		}
		return $expired;
	}
}
