<?php
// app/Http/Controllers/SuperAdmin/InventoryController.php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    /**
     * View inventory for a specific branch
     */
    public function viewBranchInventory(Request $request, Branch $branch)
    {
        $ingredients = $branch->branchIngredients()
            ->with('ingredient')
            ->orderBy('quantity', 'asc')
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->ingredient->id,
                    'name' => $item->ingredient->name,
                    'quantity' => $item->quantity,
                    'unit' => $item->ingredient->unit,
                    'status' => $this->getStockStatus($item->quantity)
                ];
            });
            
        $stocks = $branch->productStocks()
            ->with('product')
            ->where('quantity', '>', 0)
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'quantity' => $item->quantity,
                    'status' => $this->getStockStatus($item->quantity, true)
                ];
            });
            
        return response()->json([
            'branch' => $branch->name,
            'ingredients' => $ingredients,
            'stock_products' => $stocks,
            'summary' => [
                'total_ingredients' => $ingredients->count(),
                'low_stock_items' => $ingredients->where('status', 'low')->count(),
                'critical_stock_items' => $ingredients->where('status', 'critical')->count()
            ]
        ]);
    }
    
    /**
     * Get all branches inventory summary
     */
    public function getAllInventorySummary(Request $request)
    {
        $branches = Branch::with(['branchIngredients.ingredient', 'productStocks.product'])
            ->get();
            
        $summary = [];
        
        foreach ($branches as $branch) {
            $lowStockCount = $branch->branchIngredients
                ->filter(function($item) {
                    return $item->quantity < 10;
                })->count();
                
            $summary[] = [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'branch_type' => $branch->type,
                'total_ingredients' => $branch->branchIngredients->count(),
                'low_stock_items' => $lowStockCount,
                'critical_stock_items' => $branch->branchIngredients
                    ->filter(function($item) {
                        return $item->quantity < 5;
                    })->count()
            ];
        }
        
        return response()->json($summary);
    }
    
    private function getStockStatus($quantity, $isProduct = false)
    {
        $threshold = $isProduct ? 5 : 10;
        
        if ($quantity <= 0) return 'out_of_stock';
        if ($quantity < $threshold) return 'low';
        if ($quantity < $threshold * 2) return 'medium';
        return 'good';
    }
}