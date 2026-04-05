<?php
// app/Http/Controllers/Admin/ExportController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ExportController extends Controller
{
    /**
     * Export sales report as CSV
     */
    public function exportSales(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'format' => 'sometimes|in:csv,excel'
        ]);
        
        $user = Auth::user();
        $branch = $user->branch;
        
        $orders = $branch->orders()
            ->with(['staff', 'items.product'])
            ->whereBetween('created_at', [$request->start_date, $request->end_date])
            ->get();
            
        $filename = "sales_report_{$branch->name}_{$request->start_date}_to_{$request->end_date}.csv";
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];
        
        $callback = function() use ($orders) {
            $file = fopen('php://output', 'w');
            
            // Add headers
            fputcsv($file, ['Order ID', 'Date', 'Staff', 'Total Amount', 'Payment', 'Change', 'Items']);
            
            // Add rows
            foreach ($orders as $order) {
                $itemsList = $order->items->map(function($item) {
                    return "{$item->product->name} x{$item->quantity}";
                })->implode('; ');
                
                fputcsv($file, [
                    $order->id,
                    $order->created_at,
                    $order->staff->name,
                    $order->total_amount,
                    $order->payment,
                    $order->change_amount,
                    $itemsList
                ]);
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }
    
    /**
     * Export inventory report
     */
    public function exportInventory(Request $request)
    {
        $user = Auth::user();
        $branch = $user->branch;
        
        $ingredients = $branch->branchIngredients()
            ->with('ingredient')
            ->get();
            
        $filename = "inventory_report_{$branch->name}_" . now()->format('Y-m-d') . ".csv";
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];
        
        $callback = function() use ($ingredients) {
            $file = fopen('php://output', 'w');
            
            fputcsv($file, ['Ingredient', 'Quantity', 'Unit', 'Status']);
            
            foreach ($ingredients as $item) {
                $status = 'Good';
                if ($item->quantity <= 0) $status = 'Critical';
                elseif ($item->quantity < 10) $status = 'Low';
                
                fputcsv($file, [
                    $item->ingredient->name,
                    $item->quantity,
                    $item->ingredient->unit,
                    $status
                ]);
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }
}