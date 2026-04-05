<?php
// app/Http/Controllers/SuperAdmin/DashboardController.php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Report;
use App\Models\User;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    protected $analyticsService;
    
    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }
    
    /**
     * Get Super Admin dashboard data
     */
    public function index(Request $request)
    {
        $stats = [
            'total_branches' => Branch::count(),
            'total_company_branches' => Branch::where('type', 'company')->count(),
            'total_franchises' => Branch::where('type', 'franchise')->count(),
            'total_admins' => User::whereHas('role', function($q) {
                $q->where('name', 'Admin');
            })->count(),
            'pending_reports' => Report::where('status', 'pending')->count(),
            'recent_reports' => $this->getRecentReports(),
            'overall_sales' => $this->analyticsService->getOverallSales($request->get('period', 'monthly')),
            'branch_performance' => $this->getBranchPerformance(),
            'inventory_alerts' => $this->getInventoryAlerts()
        ];
        
        return response()->json($stats);
    }
    
    /**
     * Get recent reports
     */
    private function getRecentReports()
    {
        return Report::with(['branch', 'admin'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function($report) {
                return [
                    'id' => $report->id,
                    'title' => $report->title,
                    'type' => $report->type,
                    'branch' => $report->branch->name,
                    'priority' => $report->priority,
                    'status' => $report->status,
                    'created_at' => $report->created_at
                ];
            });
    }
    
    /**
     * Get branch performance summary
     */
    private function getBranchPerformance()
    {
        $branches = Branch::where('type', 'company')->get();
        $performance = [];
        
        foreach ($branches as $branch) {
            $sales = $this->analyticsService->getBranchSales($branch, 'monthly');
            $performance[] = [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'total_sales' => $sales['total_sales'],
                'order_count' => $sales['order_count'],
                'growth' => $sales['growth_percentage'] ?? 0
            ];
        }
        
        return $performance;
    }
    
    /**
     * Get inventory alerts across all branches
     */
    private function getInventoryAlerts()
    {
        return DB::table('branch_ingredients')
            ->join('branches', 'branch_ingredients.branch_id', '=', 'branches.id')
            ->join('ingredients', 'branch_ingredients.ingredient_id', '=', 'ingredients.id')
            ->where('branch_ingredients.quantity', '<', 10)
            ->select(
                'branches.name as branch_name',
                'ingredients.name as ingredient_name',
                'branch_ingredients.quantity',
                'ingredients.unit'
            )
            ->limit(10)
            ->get();
    }
}