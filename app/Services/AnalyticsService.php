<?php
// app/Services/AnalyticsService.php

namespace App\Services;

use App\Models\Branch;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /**
     * Get branch sales for a period
     */
    public function getBranchSales(Branch $branch, $period = 'daily')
    {
        $query = $branch->orders();
        
        switch ($period) {
            case 'daily':
                $query->whereDate('created_at', today());
                $orders = $query->get();
                return [
                    'total_sales' => $orders->sum('total_amount'),
                    'order_count' => $orders->count(),
                    'average_order_value' => $orders->avg('total_amount'),
                    'sales_by_hour' => $this->getSalesByHour($branch, today())
                ];
                
            case 'weekly':
                $start = now()->startOfWeek();
                $end = now()->endOfWeek();
                $query->whereBetween('created_at', [$start, $end]);
                $orders = $query->get();
                return [
                    'total_sales' => $orders->sum('total_amount'),
                    'order_count' => $orders->count(),
                    'average_order_value' => $orders->avg('total_amount'),
                    'sales_by_day' => $this->getSalesByDay($branch, $start, $end)
                ];
                
            case 'monthly':
                $query->whereMonth('created_at', now()->month);
                $orders = $query->get();
                $lastMonthSales = $this->getPreviousMonthSales($branch);
                return [
                    'total_sales' => $orders->sum('total_amount'),
                    'order_count' => $orders->count(),
                    'average_order_value' => $orders->avg('total_amount'),
                    'growth_percentage' => $this->calculateGrowth($orders->sum('total_amount'), $lastMonthSales),
                    'sales_by_day' => $this->getSalesByDay($branch, now()->startOfMonth(), now()->endOfMonth())
                ];
                
            default:
                return [];
        }
    }
    
    /**
     * Get overall sales across company branches (excluding franchises)
     */
    public function getOverallSales($period = 'monthly')
    {
        $companyBranches = Branch::where('type', 'company')->get();
        $totalSales = 0;
        $totalOrders = 0;
        
        foreach ($companyBranches as $branch) {
            $sales = $this->getBranchSales($branch, $period);
            $totalSales += $sales['total_sales'];
            $totalOrders += $sales['order_count'];
        }
        
        return [
            'total_sales' => $totalSales,
            'total_orders' => $totalOrders,
            'average_order_value' => $totalOrders > 0 ? $totalSales / $totalOrders : 0,
            'branches_count' => $companyBranches->count()
        ];
    }
    
    private function getSalesByHour(Branch $branch, $date)
    {
        return $branch->orders()
            ->whereDate('created_at', $date)
            ->selectRaw('HOUR(created_at) as hour, SUM(total_amount) as total')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->pluck('total', 'hour')
            ->toArray();
    }
    
    private function getSalesByDay(Branch $branch, $start, $end)
    {
        return $branch->orders()
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }
    
    private function getPreviousMonthSales(Branch $branch)
    {
        $lastMonth = now()->subMonth();
        return $branch->orders()
            ->whereMonth('created_at', $lastMonth->month)
            ->whereYear('created_at', $lastMonth->year)
            ->sum('total_amount');
    }
    
    private function calculateGrowth($current, $previous)
    {
        if ($previous == 0) return $current > 0 ? 100 : 0;
        return (($current - $previous) / $previous) * 100;
    }
}