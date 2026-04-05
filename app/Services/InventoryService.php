<?php
// app/Services/InventoryService.php (Enhanced)

namespace App\Services;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Order;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Report;


class InventoryService
{
    protected $notificationService;
    
    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    
    /**
     * Deduct ingredients with movement tracking
     */
    private function deductIngredients(Branch $branch, Product $product, int $quantity): void
    {
        $recipes = $product->recipes;
        
        foreach ($recipes as $recipe) {
            $branchIngredient = $branch->branchIngredients()
                ->where('ingredient_id', $recipe->ingredient_id)
                ->first();
                
            if ($branchIngredient) {
                $previousQuantity = $branchIngredient->quantity;
                $deductQuantity = $recipe->quantity_needed * $quantity;
                $branchIngredient->quantity -= $deductQuantity;
                $branchIngredient->save();
                
                // Record stock movement
                StockMovement::create([
                    'branch_id' => $branch->id,
                    'ingredient_id' => $recipe->ingredient_id,
                    'type' => 'usage',
                    'quantity' => $deductQuantity,
                    'previous_quantity' => $previousQuantity,
                    'new_quantity' => $branchIngredient->quantity,
                    'notes' => "Used for product: {$product->name} x{$quantity}",
                    'created_by' => Auth::id()
                ]);
                
                // Log low stock warning
                if ($branchIngredient->quantity < 10) {
                    Log::warning("Low stock alert: {$recipe->ingredient->name} at {$branch->name}");
                }
            }
        }
    }
    
    /**
     * Add ingredient stock with movement tracking
     */
    public function addIngredientStock(Branch $branch, int $ingredientId, float $quantity, string $notes = null): bool
    {
        try {
            DB::beginTransaction();
            
            $branchIngredient = $branch->branchIngredients()
                ->where('ingredient_id', $ingredientId)
                ->first();
                
            $previousQuantity = $branchIngredient ? $branchIngredient->quantity : 0;
            
            if ($branchIngredient) {
                $branchIngredient->quantity += $quantity;
                $branchIngredient->save();
            } else {
                $branchIngredient = $branch->branchIngredients()->create([
                    'ingredient_id' => $ingredientId,
                    'quantity' => $quantity
                ]);
            }
            
            // Record stock movement
            StockMovement::create([
                'branch_id' => $branch->id,
                'ingredient_id' => $ingredientId,
                'type' => 'purchase',
                'quantity' => $quantity,
                'previous_quantity' => $previousQuantity,
                'new_quantity' => $branchIngredient->quantity,
                'notes' => $notes ?? 'Stock added',
                'created_by' => Auth::id()
            ]);
            
            // Re-enable products that might have been disabled
            $this->recheckProductsAvailability($branch);
            
            DB::commit();
            return true;
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to add ingredient stock: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Adjust ingredient stock (can be positive or negative)
     */
    public function adjustIngredientStock(Branch $branch, int $ingredientId, float $quantity, string $reason = null): bool
    {
        try {
            DB::beginTransaction();
            
            $branchIngredient = $branch->branchIngredients()
                ->where('ingredient_id', $ingredientId)
                ->first();
                
            if (!$branchIngredient) {
                throw new \Exception("Ingredient not found in this branch");
            }
            
            $previousQuantity = $branchIngredient->quantity;
            $branchIngredient->quantity += $quantity;
            
            if ($branchIngredient->quantity < 0) {
                throw new \Exception("Insufficient stock");
            }
            
            $branchIngredient->save();
            
            // Record stock movement
            StockMovement::create([
                'branch_id' => $branch->id,
                'ingredient_id' => $ingredientId,
                'type' => 'adjustment',
                'quantity' => $quantity,
                'previous_quantity' => $previousQuantity,
                'new_quantity' => $branchIngredient->quantity,
                'notes' => $reason ?? 'Manual adjustment',
                'created_by' => Auth::id()
            ]);
            
            // Re-check product availability
            $this->recheckProductsAvailability($branch);
            
            DB::commit();
            return true;
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to adjust ingredient stock: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Record waste/damage
     */
    public function recordWaste(Branch $branch, int $ingredientId, float $quantity, string $reason): bool
    {
        try {
            DB::beginTransaction();
            
            $branchIngredient = $branch->branchIngredients()
                ->where('ingredient_id', $ingredientId)
                ->first();
                
            if (!$branchIngredient || $branchIngredient->quantity < $quantity) {
                throw new \Exception("Insufficient stock to record waste");
            }
            
            $previousQuantity = $branchIngredient->quantity;
            $branchIngredient->quantity -= $quantity;
            $branchIngredient->save();
            
            // Record stock movement
            StockMovement::create([
                'branch_id' => $branch->id,
                'ingredient_id' => $ingredientId,
                'type' => 'waste',
                'quantity' => $quantity,
                'previous_quantity' => $previousQuantity,
                'new_quantity' => $branchIngredient->quantity,
                'notes' => $reason,
                'created_by' => Auth::id()
            ]);
            
            // Create waste report automatically
            $this->createWasteReport($branch, $ingredientId, $quantity, $reason);
            
            DB::commit();
            return true;
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to record waste: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Create waste report
     */
    private function createWasteReport($branch, $ingredientId, $quantity, $reason)
    {
        $ingredient = \App\Models\Ingredient::find($ingredientId);
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
                'title' => 'Waste Report',
                'description' => "Wasted {$quantity} {$ingredient->unit} of {$ingredient->name}\nReason: {$reason}",
                'priority' => 'medium',
                'status' => 'pending'
            ]);
        }
    }
    
    /**
     * Get stock movement history
     */
    public function getStockHistory(Branch $branch, int $ingredientId, $startDate = null, $endDate = null)
    {
        $query = StockMovement::where('branch_id', $branch->id)
            ->where('ingredient_id', $ingredientId)
            ->with('creator');
            
        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }
        
        return $query->orderBy('created_at', 'desc')->get();
    }
// Add to app/Services/InventoryService.php

    /**
     * Check if product is available for ordering
     */
    public function checkProductAvailability(Branch $branch, Product $product, int $quantity = 1): bool
    {
        // Check if product is available in branch
        $branchProduct = $branch->branchProducts()
            ->where('product_id', $product->id)
            ->first();
            
        if (!$branchProduct || !$branchProduct->is_available) {
            return false;
        }
        
        // Check based on product type
        if ($product->isIngredientBased()) {
            return $this->checkIngredientAvailability($branch, $product, $quantity);
        } else {
            return $this->checkStockAvailability($branch, $product, $quantity);
        }
    }
    
    /**
     * Check ingredient-based product availability
     */
    private function checkIngredientAvailability(Branch $branch, Product $product, int $quantity): bool
    {
        $recipes = $product->recipes;
        
        foreach ($recipes as $recipe) {
            $branchIngredient = $branch->branchIngredients()
                ->where('ingredient_id', $recipe->ingredient_id)
                ->first();
                
            if (!$branchIngredient) {
                return false;
            }
            
            $neededQuantity = $recipe->quantity_needed * $quantity;
            
            if ($branchIngredient->quantity < $neededQuantity) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Check stock-based product availability
     */
    private function checkStockAvailability(Branch $branch, Product $product, int $quantity): bool
    {
        $productStock = $branch->productStocks()
            ->where('product_id', $product->id)
            ->first();
            
        return $productStock && $productStock->quantity >= $quantity;
    }
    
    /**
     * Deduct ingredients/stock when order is placed
     */
    
    /**
     * Deduct stock for stock-based product
     */
 
    
    /**
     * Auto-disable product if insufficient ingredients/stocks
     */
    private function autoDisableProductIfNeeded(Branch $branch, Product $product): void
    {
        $branchProduct = $branch->branchProducts()
            ->where('product_id', $product->id)
            ->first();
            
        if ($branchProduct && $branchProduct->is_available) {
            $isAvailable = $this->checkProductAvailability($branch, $product);
            
            if (!$isAvailable) {
                $branchProduct->is_available = false;
                $branchProduct->save();
            }
        }
    }
    
    /**
     * Recheck and re-enable products if ingredients are sufficient
     */
    private function recheckProductsAvailability(Branch $branch): void
    {
        $branchProducts = $branch->branchProducts()
            ->with('product')
            ->get();
            
        foreach ($branchProducts as $bp) {
            if (!$bp->is_available) {
                $isAvailable = $this->checkProductAvailability($branch, $bp->product);
                
                if ($isAvailable) {
                    $bp->is_available = true;
                    $bp->save();
                }
            }
        }
    }

// In app/Services/InventoryService.php

/**
 * Deduct stock for stock-based product
 */
private function deductStock(Branch $branch, Product $product, int $quantity, ?Order $order = null): void
{
    $productStock = $branch->productStocks()
        ->where('product_id', $product->id)
        ->first();
        
    if ($productStock) {
        $previousQuantity = $productStock->quantity;
        $productStock->quantity -= $quantity;
        $productStock->save();
        
        // Record stock movement for stock-based product
        StockMovement::create([
            'branch_id' => $branch->id,
            'ingredient_id' => null,
            'order_id' => $order?->id,
            'type' => 'usage',
            'quantity' => $quantity,
            'previous_quantity' => $previousQuantity,
            'new_quantity' => $productStock->quantity,
            'notes' => "Sold product: {$product->name} x{$quantity}",
            'created_by' => Auth::id()
        ]);
    }
}

/**
 * Deduct ingredients/stock when order is placed
 */
public function deductOrderItems(Branch $branch, Order $order): bool
{
    try {
        DB::beginTransaction();
        
        foreach ($order->items as $item) {
            $product = $item->product;
            
            if ($product->isIngredientBased()) {
                $this->deductIngredients($branch, $product, $item->quantity);
            } else {
                $this->deductStock($branch, $product, $item->quantity, $order);
            }
            
            // Auto-disable product if insufficient stock
            $this->autoDisableProductIfNeeded($branch, $product);
        }
        
        DB::commit();
        return true;
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Failed to deduct order items: ' . $e->getMessage());
        return false;
    }
}
}
