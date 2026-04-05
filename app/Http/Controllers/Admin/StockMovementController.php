<?php
// app/Http/Controllers/Admin/StockMovementController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Report;

class StockMovementController extends Controller
{
    protected $inventoryService;
    
    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }
    
    /**
     * Get stock movement history for an ingredient
     */
    public function getHistory(Request $request, $ingredientId)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date'
        ]);
        
        $user = Auth::user();
        $branch = $user->branch;
        
        $history = $this->inventoryService->getStockHistory(
            $branch,
            $ingredientId,
            $request->start_date,
            $request->end_date
        );
        
        return response()->json($history);
    }
    
    /**
     * Record waste/damage
     */
    public function recordWaste(Request $request)
    {
        $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'quantity' => 'required|numeric|min:0.01',
            'reason' => 'required|string'
        ]);
        
        $user = Auth::user();
        
        $result = $this->inventoryService->recordWaste(
            $user->branch,
            $request->ingredient_id,
            $request->quantity,
            $request->reason
        );
        
        if ($result) {
            return response()->json([
                'message' => 'Waste recorded successfully'
            ]);
        }
        
        return response()->json([
            'message' => 'Failed to record waste'
        ], 500);
    }
    
    /**
     * Adjust stock manually
     */
    public function adjustStock(Request $request)
    {
        $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'quantity' => 'required|numeric', // Can be negative or positive
            'reason' => 'required|string'
        ]);
        
        $user = Auth::user();
        
        $result = $this->inventoryService->adjustIngredientStock(
            $user->branch,
            $request->ingredient_id,
            $request->quantity,
            $request->reason
        );
        
        if ($result) {
            return response()->json([
                'message' => 'Stock adjusted successfully'
            ]);
        }
        
        return response()->json([
            'message' => 'Failed to adjust stock'
        ], 500);
    }
}