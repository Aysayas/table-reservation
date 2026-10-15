<?php

/**
 * php lava migration run|rollback|status
 *
 * Boots the framework through public/index.php with a CLI-only route
 * (migration/<action>) so the Migration library runs with full config.
 */
class MigrationCommand
{
    public static $command = 'migration';

    public static $description = 'Run, roll back or list database migrations';

    public static $arguments = [
        'action' => 'run | rollback | status (default: run)'
    ];

    public function handle($input = null, array $flags = [])
    {
        $action = $input ?: 'run';

        if (!in_array($action, ['run', 'rollback', 'status'], true)) {
            echo "Unknown migration action \"$action\". Use run, rollback or status." . PHP_EOL;
            exit(1);
        }

        $index = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'index.php';
        passthru(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($index) . ' migration/' . $action, $code);
        exit($code);
    }
}
