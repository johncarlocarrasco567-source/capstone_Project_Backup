<?php
// app/Http/Controllers/Admin/DashboardController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    protected $analyticsService;
    
    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }
    
    /**
     * Get Admin dashboard data for their branch
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $branch = $user->branch;
        
        $stats = [
            'branch_info' => [
                'name' => $branch->name,
                'location' => $branch->location,
                'type' => $branch->type
            ],
            'today_sales' => $this->getTodaySales($branch),
            'weekly_sales' => $this->analyticsService->getBranchSales($branch, 'weekly'),
            'monthly_sales' => $this->analyticsService->getBranchSales($branch, 'monthly'),
            'inventory_status' => $this->getInventoryStatus($branch),
            'staff_performance' => $this->getStaffPerformance($branch),
            'recent_orders' => $this->getRecentOrders($branch),
            'low_stock_alerts' => $this->getLowStockAlerts($branch),
            'pending_reports' => $branch->reports()->where('status', 'pending')->count()
        ];
        
        return response()->json($stats);
    }
    
    private function getTodaySales($branch)
    {
        $today = now()->toDateString();
        
        $orders = $branch->orders()
            ->whereDate('created_at', $today)
            ->get();
            
        return [
            'total_sales' => $orders->sum('total_amount'),
            'order_count' => $orders->count(),
            'average_order' => $orders->avg('total_amount')
        ];
    }
    
    private function getInventoryStatus($branch)
    {
        $totalIngredients = $branch->branchIngredients()->count();
        $lowStock = $branch->branchIngredients()
            ->where('quantity', '<', 10)
            ->count();
        $criticalStock = $branch->branchIngredients()
            ->where('quantity', '<', 5)
            ->count();
            
        return [
            'total_ingredients' => $totalIngredients,
            'low_stock_count' => $lowStock,
            'critical_stock_count' => $criticalStock,
            'stock_status_percentage' => $totalIngredients > 0 
                ? (($totalIngredients - $lowStock) / $totalIngredients) * 100 
                : 100
        ];
    }
    
    private function getStaffPerformance($branch)
    {
        $staff = $branch->users()
            ->whereHas('role', function($q) {
                $q->where('name', 'Staff');
            })
            ->withCount(['orders' => function($q) {
                $q->whereDate('created_at', now()->toDateString());
            }])
            ->withSum(['orders as today_sales' => function($q) {
                $q->whereDate('created_at', now()->toDateString());
            }], 'total_amount')
            ->take(5)
            ->get();
            
        return $staff->map(function($staff) {
            return [
                'id' => $staff->id,
                'name' => $staff->name,
                'orders_today' => $staff->orders_count,
                'sales_today' => $staff->today_sales ?? 0
            ];
        });
    }
    
    private function getRecentOrders($branch)
    {
        return $branch->orders()
            ->with(['staff', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function($order) {
                return [
                    'id' => $order->id,
                    'total' => $order->total_amount,
                    'staff' => $order->staff->name,
                    'items_count' => $order->items->count(),
                    'created_at' => $order->created_at
                ];
            });
    }
    
    private function getLowStockAlerts($branch)
    {
        return $branch->branchIngredients()
            ->with('ingredient')
            ->where('quantity', '<', 10)
            ->orderBy('quantity', 'asc')
            ->get()
            ->map(function($item) {
                return [
                    'ingredient' => $item->ingredient->name,
                    'quantity' => $item->quantity,
                    'unit' => $item->ingredient->unit,
                    'status' => $item->quantity < 5 ? 'critical' : 'low'
                ];
            });
    }
}