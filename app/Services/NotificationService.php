<?php
// app/Services/NotificationService.php

namespace App\Services;

use App\Models\Branch;
use App\Models\Report;
use Illuminate\Support\Facades\Log;


class NotificationService
{
    /**
     * Check all branches for low stock and create alerts
     */
    public function checkLowStockAlerts()
    {
        $branches = Branch::with(['branchIngredients.ingredient'])->get();
        $alerts = [];
        
        foreach ($branches as $branch) {
            $lowStockItems = $branch->branchIngredients
                ->filter(function($item) {
                    return $item->quantity < 10 && $item->quantity > 0;
                });
                
            $criticalStockItems = $branch->branchIngredients
                ->filter(function($item) {
                    return $item->quantity <= 0;
                });
                
            if ($lowStockItems->count() > 0 || $criticalStockItems->count() > 0) {
                // Create automatic report for low stock
                $this->createLowStockReport($branch, $lowStockItems, $criticalStockItems);
                
                $alerts[] = [
                    'branch' => $branch->name,
                    'low_stock' => $lowStockItems->count(),
                    'critical_stock' => $criticalStockItems->count(),
                    'items' => $lowStockItems->map(function($item) {
                        return [
                            'name' => $item->ingredient->name,
                            'quantity' => $item->quantity,
                            'unit' => $item->ingredient->unit
                        ];
                    })->values()
                ];
            }
        }
        
        return $alerts;
    }
    
    /**
     * Create automatic low stock report
     */
    private function createLowStockReport($branch, $lowStockItems, $criticalStockItems)
    {
        $description = "Low stock alert:\n";
        
        if ($criticalStockItems->count() > 0) {
            $description .= "\nCRITICAL (Out of Stock):\n";
            foreach ($criticalStockItems as $item) {
                $description .= "- {$item->ingredient->name}: {$item->quantity} {$item->ingredient->unit}\n";
            }
        }
        
        if ($lowStockItems->count() > 0) {
            $description .= "\nLOW STOCK:\n";
            foreach ($lowStockItems as $item) {
                $description .= "- {$item->ingredient->name}: {$item->quantity} {$item->ingredient->unit}\n";
            }
        }
        
        // Find the branch admin
        $admin = $branch->users()
            ->whereHas('role', function($q) {
                $q->where('name', 'Admin');
            })
            ->first();
            
        if ($admin) {
            Report::create([
                'branch_id' => $branch->id,
                'admin_id' => $admin->id,
                'type' => 'damage',
                'title' => 'Automatic Low Stock Alert',
                'description' => $description,
                'priority' => $criticalStockItems->count() > 0 ? 'high' : 'medium',
                'status' => 'pending'
            ]);
        }
    }
}