<?php
// app/Http/Controllers/SuperAdmin/SalesAnalyticsController.php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;

class SalesAnalyticsController extends Controller
{
    protected $analyticsService;
    
    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }
    
    /**
     * Get sales per branch (daily/weekly/monthly)
     */
    public function getBranchSales(Request $request, Branch $branch)
    {
        $request->validate([
            'period' => 'required|in:daily,weekly,monthly'
        ]);
        
        $sales = $this->analyticsService->getBranchSales($branch, $request->period);
        
        return response()->json([
            'branch' => $branch->name,
            'period' => $request->period,
            'data' => $sales
        ]);
    }
    
    /**
     * Get overall sales (excluding franchises)
     */
    public function getOverallSales(Request $request)
    {
        $request->validate([
            'period' => 'required|in:daily,weekly,monthly'
        ]);
        
        $companyBranches = Branch::where('type', 'company')->get();
        $overall = [
            'total_sales' => 0,
            'total_orders' => 0,
            'average_order_value' => 0,
            'branches_data' => []
        ];
        
        foreach ($companyBranches as $branch) {
            $branchSales = $this->analyticsService->getBranchSales($branch, $request->period);
            $overall['total_sales'] += $branchSales['total_sales'];
            $overall['total_orders'] += $branchSales['order_count'];
            $overall['branches_data'][] = [
                'branch_name' => $branch->name,
                'sales' => $branchSales['total_sales'],
                'orders' => $branchSales['order_count']
            ];
        }
        
        $overall['average_order_value'] = $overall['total_orders'] > 0 
            ? $overall['total_sales'] / $overall['total_orders'] 
            : 0;
            
        return response()->json($overall);
    }
    
    /**
     * Get sales chart data
     */
    public function getSalesChart(Request $request)
    {
        $request->validate([
            'period' => 'required|in:daily,weekly,monthly',
            'include_franchises' => 'boolean'
        ]);
        
        $branches = $request->include_franchises 
            ? Branch::all() 
            : Branch::where('type', 'company')->get();
            
        $chartData = [];
        
        foreach ($branches as $branch) {
            $sales = $this->analyticsService->getBranchSales($branch, $request->period);
            $chartData[] = [
                'branch' => $branch->name,
                'sales' => $sales['daily_sales'] ?? $sales['sales_by_day'] ?? []
            ];
        }
        
        return response()->json($chartData);
    }
}