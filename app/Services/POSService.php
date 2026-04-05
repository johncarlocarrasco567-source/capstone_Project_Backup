<?php
// app/Services/POSService.php

namespace App\Services;

use App\Models\Branch;
use App\Models\Order;
use App\Models\User;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class POSService
{
    protected $inventoryService;
    
    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }
    
    /**
     * Process an order
     */
    public function processOrder(Branch $branch, User $staff, array $items, float $payment): ?Order
    {
        try {
            DB::beginTransaction();
            
            // Calculate total and validate items
            $total = 0;
            $orderItems = [];
            
            foreach ($items as $item) {
                $product = Product::find($item['product_id']);
                
                if (!$product) {
                    throw new \Exception("Product not found: {$item['product_id']}");
                }
                
                // Check availability
                if (!$this->inventoryService->checkProductAvailability($branch, $product, $item['quantity'])) {
                    throw new \Exception("Product {$product->name} is not available in sufficient quantity");
                }
                
                $subtotal = $product->price * $item['quantity'];
                $total += $subtotal;
                
                $orderItems[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                    'subtotal' => $subtotal
                ];
            }
            
            // Calculate change
            $change = $payment - $total;
            
            if ($change < 0) {
                throw new \Exception("Insufficient payment amount");
            }
            
            // Create order
            $order = Order::create([
                'branch_id' => $branch->id,
                'staff_id' => $staff->id,
                'total_amount' => $total,
                'payment' => $payment,
                'change_amount' => $change
            ]);
            
            // Create order items and deduct inventory
            foreach ($orderItems as $item) {
                $order->items()->create([
                    'product_id' => $item['product']->id,
                    'quantity' => $item['quantity'],
                    'price' => $item['price']
                ]);
            }
            
            // Deduct inventory
            $this->inventoryService->deductOrderItems($branch, $order);
            
            DB::commit();
            
            return $order->load('items.product');
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('POS order processing failed: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Get available products for POS
     */
    public function getAvailableProducts(Branch $branch)
    {
        $branchProducts = $branch->branchProducts()
            ->with('product.category')
            ->where('is_available', true)
            ->get();
            
        $products = [];
        
        foreach ($branchProducts as $bp) {
            $product = $bp->product;
            $product->is_available = true;
            
            // Check if really available based on stock/ingredients
            $isAvailable = $this->inventoryService->checkProductAvailability($branch, $product);
            
            if (!$isAvailable) {
                $bp->is_available = false;
                $bp->save();
                continue;
            }
            
            $products[] = $product;
        }
        
        return collect($products);
    }
}