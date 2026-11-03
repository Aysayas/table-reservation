<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class Notify {
	public function reservation($reservation_id, $kind)
	{
		$lava = lava_instance();
		$lava->call->library('sms');
		$lava->call->library('mailer');
		$lava->sms->reservation($reservation_id, $kind);
		$lava->mailer->reservation($reservation_id, $kind);
	}
}
