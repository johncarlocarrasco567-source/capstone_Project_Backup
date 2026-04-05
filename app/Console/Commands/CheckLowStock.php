<?php
// app/Console/Commands/CheckLowStock.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\NotificationService;

class CheckLowStock extends Command
{
    protected $signature = 'stock:check-low';
    protected $description = 'Check for low stock levels across all branches and create alerts';
    
    protected $notificationService;
    
    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }
    
    public function handle()
    {
        $this->info('Checking low stock levels...');
        
        $alerts = $this->notificationService->checkLowStockAlerts();
        
        $this->info('Low stock check completed.');
        $this->info('Alerts created: ' . count($alerts));
        
        foreach ($alerts as $alert) {
            $this->line("Branch: {$alert['branch']} - Low: {$alert['low_stock']}, Critical: {$alert['critical_stock']}");
        }
        
        return Command::SUCCESS;
    }
}