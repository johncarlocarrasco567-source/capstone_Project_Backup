<?php
// app/Http/Controllers/Staff/POSController.php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Services\POSService;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class POSController extends Controller
{
    protected $posService;
    protected $inventoryService;
    
    public function __construct(POSService $posService, InventoryService $inventoryService)
    {
        $this->posService = $posService;
        $this->inventoryService = $inventoryService;
    }
    
    /**
     * Get available products for POS
     */
    public function getProducts(Request $request)
    {
        $user = Auth::user();
        $branch = $user->branch;
        
        $products = $this->posService->getAvailableProducts($branch);
        
        // Format products with image URL using the model accessor
        $formattedProducts = $products->map(function($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'price' => (float) $product->price,
                'image' => $product->image_url, // Use the accessor
                'category' => $product->category ? $product->category->name : 'Uncategorized',
                'type' => $product->type,
                'is_available' => true
            ];
        });
        
        // Group by category for better UI
        $grouped = $formattedProducts->groupBy('category');
        
        return response()->json([
            'products' => $formattedProducts,
            'grouped' => $grouped
        ]);
    }
    
    // Rest of your controller methods remain the same...
    
    public function processOrder(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'payment' => 'required|numeric|min:0'
        ]);
        
        $user = Auth::user();
        
        try {
            $order = $this->posService->processOrder(
                $user->branch,
                $user,
                $request->items,
                $request->payment
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Order processed successfully',
                'order' => [
                    'id' => $order->id,
                    'total_amount' => $order->total_amount,
                    'payment' => $order->payment,
                    'change' => $order->change_amount,
                    'items' => $order->items->map(function($item) {
                        return [
                            'name' => $item->product->name,
                            'quantity' => $item->quantity,
                            'price' => $item->price,
                            'subtotal' => $item->quantity * $item->price
                        ];
                    })
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
    
    public function toggleProduct(Request $request, $productId)
    {
        $request->validate([
            'is_available' => 'required|boolean'
        ]);
        
        $user = Auth::user();
        $branch = $user->branch;
        
        $branchProduct = $branch->branchProducts()
            ->where('product_id', $productId)
            ->first();
            
        if (!$branchProduct) {
            return response()->json([
                'message' => 'Product not found in this branch'
            ], 404);
        }
        
        $branchProduct->is_available = $request->is_available;
        $branchProduct->save();
        
        return response()->json([
            'message' => 'Product visibility updated',
            'product_id' => $productId,
            'is_available' => $request->is_available
        ]);
    }
    
    public function calculateTotal(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1'
        ]);
        
        $user = Auth::user();
        $branch = $user->branch;
        $total = 0;
        $items = [];
        
        foreach ($request->items as $item) {
            $product = \App\Models\Product::find($item['product_id']);
            
            if (!$this->inventoryService->checkProductAvailability($branch, $product, $item['quantity'])) {
                return response()->json([
                    'message' => "{$product->name} is not available in requested quantity"
                ], 400);
            }
            
            $subtotal = $product->price * $item['quantity'];
            $total += $subtotal;
            
            $items[] = [
                'id' => $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'quantity' => $item['quantity'],
                'subtotal' => $subtotal
            ];
        }
        
        return response()->json([
            'items' => $items,
            'total' => $total
        ]);
    }
}