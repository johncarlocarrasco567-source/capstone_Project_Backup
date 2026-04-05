<?php
// app/Http/Controllers/Admin/InventoryController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InventoryController extends Controller
{
    /**
     * Get branch ingredients inventory
     */
    public function getIngredients()
    {
        $user = Auth::user();
        $branch = $user->branch;
        
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
                    'status' => $this->getStatus($item->quantity)
                ];
            });
            
        return response()->json($ingredients);
    }
    
    /**
     * Update ingredient stock
     */
    public function updateIngredientStock(Request $request)
    {
        $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'quantity' => 'required|numeric|min:0',
            'operation' => 'required|in:add,subtract,set'
        ]);
        
        $user = Auth::user();
        $branch = $user->branch;
        
        $branchIngredient = $branch->branchIngredients()
            ->where('ingredient_id', $request->ingredient_id)
            ->first();
            
        if (!$branchIngredient) {
            $branchIngredient = $branch->branchIngredients()->create([
                'ingredient_id' => $request->ingredient_id,
                'quantity' => 0
            ]);
        }
        
        switch ($request->operation) {
            case 'add':
                $branchIngredient->quantity += $request->quantity;
                break;
            case 'subtract':
                if ($branchIngredient->quantity < $request->quantity) {
                    return response()->json([
                        'message' => 'Insufficient stock'
                    ], 400);
                }
                $branchIngredient->quantity -= $request->quantity;
                break;
            case 'set':
                $branchIngredient->quantity = $request->quantity;
                break;
        }
        
        $branchIngredient->save();
        
        // Re-check product availability after inventory update
        $this->recheckProductAvailability($branch);
        
        return response()->json([
            'message' => 'Inventory updated successfully',
            'ingredient' => [
                'id' => $branchIngredient->ingredient_id,
                'quantity' => $branchIngredient->quantity
            ]
        ]);
    }
    
    /**
     * Add new ingredient to system
     */
    public function addIngredient(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'unit' => 'required|string|max:50'
        ]);
        
        $ingredient = Ingredient::create($request->only(['name', 'unit']));
        
        // Add to all branches? Or just current branch?
        $user = Auth::user();
        $user->branch->branchIngredients()->create([
            'ingredient_id' => $ingredient->id,
            'quantity' => 0
        ]);
        
        return response()->json([
            'message' => 'Ingredient added successfully',
            'ingredient' => $ingredient
        ], 201);
    }
    
    /**
     * Get stock-based products inventory
     */
    public function getProductStocks(Request $request)
    {
        $user = Auth::user();
        $branch = $user->branch;
        
        $stocks = $branch->productStocks()
            ->with('product')
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'quantity' => $item->quantity,
                    'price' => $item->product->price,
                    'status' => $this->getStatus($item->quantity, true)
                ];
            });
            
        return response()->json($stocks);
    }
    
    private function getStatus($quantity, $isProduct = false)
    {
        $threshold = $isProduct ? 5 : 10;
        
        if ($quantity <= 0) return 'out_of_stock';
        if ($quantity < $threshold) return 'low';
        if ($quantity < $threshold * 2) return 'medium';
        return 'good';
    }
    
    private function recheckProductAvailability($branch)
    {
        $branchProducts = $branch->branchProducts()
            ->with('product')
            ->get();
            
        foreach ($branchProducts as $bp) {
            $product = $bp->product;
            $isAvailable = true;
            
            if ($product->isIngredientBased()) {
                $recipes = $product->recipes;
                foreach ($recipes as $recipe) {
                    $branchIngredient = $branch->branchIngredients()
                        ->where('ingredient_id', $recipe->ingredient_id)
                        ->first();
                        
                    if (!$branchIngredient || $branchIngredient->quantity < $recipe->quantity_needed) {
                        $isAvailable = false;
                        break;
                    }
                }
            } else {
                $productStock = $branch->productStocks()
                    ->where('product_id', $product->id)
                    ->first();
                    
                $isAvailable = $productStock && $productStock->quantity > 0;
            }
            
            $bp->update(['is_available' => $isAvailable]);
        }
    }
}