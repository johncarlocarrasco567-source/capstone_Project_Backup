<?php
// app/Http/Controllers/Admin/OrderController.php

namespace App\Http\Controllers\Admin;

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    /**
     * List orders for the branch
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $branch = $user->branch;
            
            $orders = $branch->orders()
                ->with(['staff', 'items.product'])
                ->when($request->date, function($query, $date) {
                    return $query->whereDate('created_at', $date);
                })
                ->when($request->staff_id, function($query, $staffId) {
                    return $query->where('staff_id', $staffId);
                })
                ->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 20))
                ->through(function($order) {
                    return [
                        'id' => $order->id,
                        'total_amount' => (float) $order->total_amount,
                        'payment' => (float) $order->payment,
                        'change' => (float) $order->change_amount,
                        'staff' => $order->staff ? $order->staff->name : 'Unknown',
                        'items_count' => $order->items->count(),
                        'created_at' => $order->created_at
                    ];
                });
                
            return response()->json($orders);
            
        } catch (\Exception $e) {
            Log::error('OrderController@index error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch orders',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get single order details
     */
    public function show(Order $order)
    {
        try {
            $user = Auth::user();
            
            // Check if order belongs to user's branch
            if ($order->branch_id !== $user->branch_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            $order->load(['staff', 'items.product', 'branch']);
            
            return response()->json([
                'id' => $order->id,
                'total_amount' => (float) $order->total_amount,
                'payment' => (float) $order->payment,
                'change_amount' => (float) $order->change_amount,
                'staff' => [
                    'id' => $order->staff ? $order->staff->id : null,
                    'name' => $order->staff ? $order->staff->name : 'Unknown'
                ],
                'branch' => [
                    'id' => $order->branch->id,
                    'name' => $order->branch->name
                ],
                'items' => $order->items->map(function($item) {
                    return [
                        'product_name' => $item->product ? $item->product->name : 'Unknown',
                        'quantity' => $item->quantity,
                        'price' => (float) $item->price,
                        'subtotal' => (float) ($item->quantity * $item->price)
                    ];
                }),
                'created_at' => $order->created_at
            ]);
            
        } catch (\Exception $e) {
            Log::error('OrderController@show error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch order details',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get order summary for today
     */
    public function getTodaySummary()
    {
        try {
            $user = Auth::user();
            $branch = $user->branch;
            
            $today = now()->toDateString();
            
            // Get today's orders
            $todayOrders = $branch->orders()
                ->whereDate('created_at', $today)
                ->get();
            
            $summary = [
                'total_orders' => $todayOrders->count(),
                'total_sales' => (float) $todayOrders->sum('total_amount'),
                'average_order_value' => (float) ($todayOrders->count() > 0 ? $todayOrders->avg('total_amount') : 0),
                'peak_hour' => $this->getPeakHour($branch, $today),
                'top_products' => $this->getTopProducts($branch, $today)
            ];
            
            return response()->json($summary);
            
        } catch (\Exception $e) {
            Log::error('OrderController@getTodaySummary error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to fetch order summary',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
    
    private function getPeakHour($branch, $date)
    {
        try {
            $hourlyOrders = $branch->orders()
                ->whereDate('created_at', $date)
                ->selectRaw('HOUR(created_at) as hour, COUNT(*) as count')
                ->groupBy('hour')
                ->orderBy('count', 'desc')
                ->first();
                
            return $hourlyOrders ? $hourlyOrders->hour . ':00' : 'N/A';
        } catch (\Exception $e) {
            Log::error('getPeakHour error: ' . $e->getMessage());
            return 'N/A';
        }
    }
    
    private function getTopProducts($branch, $date)
    {
        try {
            return DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->where('orders.branch_id', $branch->id)
                ->whereDate('orders.created_at', $date)
                ->select(
                    'products.id',
                    'products.name',
                    DB::raw('SUM(order_items.quantity) as total_quantity')
                )
                ->groupBy('products.id', 'products.name')
                ->orderBy('total_quantity', 'desc')
                ->limit(5)
                ->get();
        } catch (\Exception $e) {
            Log::error('getTopProducts error: ' . $e->getMessage());
            return collect([]);
        }
    }
}