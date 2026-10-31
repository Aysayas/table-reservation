<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');
/**
 * ------------------------------------------------------------------
 * LavaLust - an opensource lightweight PHP MVC Framework
 * ------------------------------------------------------------------
 *
 * MIT License
 *
 * Copyright (c) 2020 Ronald M. Marasigan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * @package LavaLust
 * @author Ronald M. Marasigan <ronald.marasigan@yahoo.com>
 * @since Version 1
 * @link https://github.com/ronmarasigan/LavaLust
 * @license https://opensource.org/licenses/MIT MIT License
 */

/*
| -------------------------------------------------------------------
| URI ROUTING
| -------------------------------------------------------------------
| Here is where you can register web routes for your application.
|
|
*/
/** @var object $router **/

$router->get('/', 'Health::index');
$router->get('/migrate', 'Migrate::run');
$router->get('/migrate/status', 'Migrate::status');
$router->get('/dev/db', 'Dbtest::index');
$router->get('/dev/db/crud', 'Dbtest::crud');
$router->match('/dev/db/table/{name}', 'Dbtest::table', ['GET', 'POST'])->where('name', '[a-z_]+');

$router->group(['prefix' => 'api'], function ($router) {
    $router->options('/{path}', 'Health::preflight')->where('path', '.+');
    $router->get('/health', 'Health::index');
    $router->get('/health/db', 'Health::database');

    $router->post('/auth/login', 'Auth::login');
    $router->post('/auth/register', 'Auth::register');
    $router->post('/auth/customer-login', 'Auth::customer_login');
    $router->post('/auth/forgot-password', 'Auth::forgot_password');
    $router->post('/auth/reset-password', 'Auth::reset_password');
    $router->post('/auth/refresh', 'Auth::refresh');
    $router->post('/auth/logout', 'Auth::logout');
    $router->get('/auth/me', 'Auth::me');

    $router->get('/categories', 'Categories::index');
    $router->post('/categories', 'Categories::store');
    $router->put('/categories/{id}', 'Categories::update')->where_number('id');
    $router->delete('/categories/{id}', 'Categories::destroy')->where_number('id');

    $router->get('/menu-items', 'Menu::index');
    $router->get('/menu-items/{id}', 'Menu::show')->where_number('id');
    $router->get('/recommendations', 'Menu::recommendations');
    $router->post('/menu-items', 'Menu::store');
    $router->put('/menu-items/{id}', 'Menu::update')->where_number('id');
    $router->patch('/menu-items/{id}/availability', 'Menu::availability')->where_number('id');
    $router->post('/menu-items/{id}/image', 'Menu::image')->where_number('id');
    $router->delete('/menu-items/{id}', 'Menu::destroy')->where_number('id');

    $router->get('/tables', 'Tables::index');
    $router->get('/tables/{id}', 'Tables::show')->where_number('id');
    $router->post('/tables', 'Tables::store');
    $router->put('/tables/{id}', 'Tables::update')->where_number('id');
    $router->patch('/tables/{id}/status', 'Tables::status')->where_number('id');
    $router->delete('/tables/{id}', 'Tables::destroy')->where_number('id');

    $router->get('/reservations/availability', 'Reservations::availability');
    $router->post('/reservations', 'Reservations::store');
    $router->post('/reservations/find', 'Reservations::find');
    $router->get('/my/reservations', 'Reservations::mine');
    $router->get('/reservations/code/{code}', 'Reservations::by_code')->where('code', '[A-Za-z0-9-]+');
    $router->post('/reservations/code/{code}/cancel', 'Reservations::cancel')->where('code', '[A-Za-z0-9-]+');
    $router->post('/reservations/code/{code}/reschedule', 'Reservations::reschedule')->where('code', '[A-Za-z0-9-]+');
    $router->post('/reservations/code/{code}/deposit', 'Reservations::deposit')->where('code', '[A-Za-z0-9-]+');
    $router->get('/reservations', 'Reservations::index');
    $router->get('/reservations/{id}', 'Reservations::show')->where_number('id');
    $router->put('/reservations/{id}', 'Reservations::update')->where_number('id');
    $router->patch('/reservations/{id}/status', 'Reservations::status')->where_number('id');

    $router->post('/orders', 'Orders::store');
    $router->get('/orders', 'Orders::index');
    $router->get('/orders/{id}', 'Orders::show')->where_number('id');
    $router->patch('/orders/{id}/status', 'Orders::status')->where_number('id');
    $router->post('/orders/{id}/pay', 'Orders::pay')->where_number('id');

    $router->get('/payments', 'Payments::index');
    $router->get('/payments/{id}', 'Payments::show')->where_number('id');
    $router->post('/payments', 'Payments::store');
    $router->post('/payments/webhook', 'Payments::webhook');
    $router->post('/realtime/auth', 'Realtime::auth');
    $router->post('/notifications/reminders', 'Notifications::reminders');
    $router->get('/diagnostics/{service}', 'Diagnostics::check')->where('service', '[a-z]+');
    $router->post('/diagnostics/paymongo/payment', 'Diagnostics::start_payment');
    $router->get('/diagnostics/paymongo/payment/{id}', 'Diagnostics::payment_status')->where_number('id');
    $router->post('/diagnostics/cloudinary/photo', 'Diagnostics::upload_photo');
    $router->delete('/diagnostics/cloudinary/photo', 'Diagnostics::delete_photo');
    $router->post('/diagnostics/sms', 'Diagnostics::send_sms');
    $router->get('/diagnostics/sms/latest', 'Diagnostics::latest_sms');

    $router->get('/users', 'Users::index');
    $router->post('/users', 'Users::store');
    $router->put('/users/{id}', 'Users::update')->where_number('id');
    $router->delete('/users/{id}', 'Users::destroy')->where_number('id');

    $router->get('/settings', 'Settings::show');
    $router->put('/settings', 'Settings::update');
    $router->post('/settings/logo', 'Settings::logo');
    $router->get('/opening-hours', 'Settings::hours');
    $router->put('/opening-hours', 'Settings::update_hours');

    $router->get('/reports', 'Reports::index');
    $router->get('/dashboard/staff', 'Dashboard::staff');
    $router->get('/dashboard/admin', 'Dashboard::admin');
});