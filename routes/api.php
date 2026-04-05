<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SuperAdmin\BranchController as SuperAdminBranchController;
use App\Http\Controllers\SuperAdmin\InventoryController as SuperAdminInventoryController;
use App\Http\Controllers\SuperAdmin\SalesAnalyticsController;
use App\Http\Controllers\SuperAdmin\ReportReviewController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\InventoryController as AdminInventoryController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\ExportController;
use App\Http\Controllers\Admin\StockMovementController;
use App\Http\Controllers\Staff\POSController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/dashboard', [AuthController::class, 'getDashboard']);
    
    // ==================== SUPER ADMIN ROUTES ====================
    Route::prefix('super-admin')->middleware(\App\Http\Middleware\RoleMiddleware::class . ':Super Admin')->group(function () {
        // Branch Management
        Route::apiResource('branches', SuperAdminBranchController::class);
        Route::post('branches/{branch}/create-admin', [SuperAdminBranchController::class, 'createAdmin']);
        
        // Inventory View
        Route::get('branches/{branch}/inventory', [SuperAdminInventoryController::class, 'viewBranchInventory']);
        Route::get('inventory/summary', [SuperAdminInventoryController::class, 'getAllInventorySummary']);
        
        // Sales Analytics
        Route::get('sales/overall', [SalesAnalyticsController::class, 'getOverallSales']);
        Route::get('branches/{branch}/sales', [SalesAnalyticsController::class, 'getBranchSales']);
        Route::get('sales/chart', [SalesAnalyticsController::class, 'getSalesChart']);
        
        // Reports Review
        Route::get('reports', [ReportReviewController::class, 'index']);
        Route::get('reports/{report}', [ReportReviewController::class, 'show']);
        Route::post('reports/{report}/approve', [ReportReviewController::class, 'approve']);
        Route::post('reports/{report}/reject', [ReportReviewController::class, 'reject']);
        
        // Category Management for Super Admin
        Route::get('categories/all', [\App\Http\Controllers\Admin\CategoryController::class, 'getAllCategories']);
        Route::post('categories/{category}/toggle', [\App\Http\Controllers\Admin\CategoryController::class, 'toggleVisibility']);
    });
    
    // ==================== ADMIN ROUTES ====================
    Route::prefix('admin')->middleware(\App\Http\Middleware\RoleMiddleware::class . ':Admin')->group(function () {
        // Dashboard
        Route::get('dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index']);

        // Category Management
        Route::apiResource('category', \App\Http\Controllers\Admin\CategoryController::class);
        
        // Product Management
        Route::apiResource('products', AdminProductController::class);
        Route::post('products/{product}/recipe', [AdminProductController::class, 'addRecipe']);
        Route::post('products/{product}/stock', [AdminProductController::class, 'setStock']);
        
        // Inventory Management
        Route::prefix('inventory')->group(function () {
            Route::get('ingredients', [AdminInventoryController::class, 'getIngredients']);
            Route::post('ingredients/update', [AdminInventoryController::class, 'updateIngredientStock']);
            Route::post('ingredients', [AdminInventoryController::class, 'addIngredient']);
            Route::get('stocks', [AdminInventoryController::class, 'getProductStocks']);
            
            // Stock Movement Routes
            Route::get('ingredients/{ingredientId}/history', [StockMovementController::class, 'getHistory']);
            Route::post('waste', [StockMovementController::class, 'recordWaste']);
            Route::post('adjust', [StockMovementController::class, 'adjustStock']);
        });
        
        // Staff Management
        Route::apiResource('staff', StaffController::class);
        
        // Order Monitoring
        Route::get('orders', [AdminOrderController::class, 'index']);
        Route::get('orders/today-summary', [AdminOrderController::class, 'getTodaySummary']);
        Route::get('orders/{order}', [AdminOrderController::class, 'show']);
        
        // Reports
        Route::apiResource('reports', AdminReportController::class);
        
        // Export Routes
        Route::prefix('export')->group(function () {
            Route::get('sales', [ExportController::class, 'exportSales']);
            Route::get('inventory', [ExportController::class, 'exportInventory']);
        });
    });
    
    // ==================== STAFF (POS) ROUTES ====================
    Route::prefix('staff')->middleware(\App\Http\Middleware\RoleMiddleware::class . ':Staff')->group(function () {
        Route::get('pos/products', [POSController::class, 'getProducts']);
        Route::post('pos/order', [POSController::class, 'processOrder']);
        Route::post('pos/calculate', [POSController::class, 'calculateTotal']);
        Route::patch('pos/products/{productId}/toggle', [POSController::class, 'toggleProduct']);
    });
});

// Temporary test route for orders debugging
Route::middleware('auth:sanctum')->get('/test-orders', function () {
    try {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'No user'], 401);
        }
        
        $branch = $user->branch;
        if (!$branch) {
            return response()->json(['error' => 'No branch'], 400);
        }
        
        $today = now()->toDateString();
        
        // Test each part separately
        $result = [
            'user_id' => $user->id,
            'branch_id' => $branch->id,
            'branch_name' => $branch->name,
            'today' => $today,
        ];
        
        // Test simple query
        try {
            $ordersCount = DB::table('orders')
                ->where('branch_id', $branch->id)
                ->count();
            $result['total_orders_all_time'] = $ordersCount;
        } catch (\Exception $e) {
            $result['orders_query_error'] = $e->getMessage();
        }
        
        // Test today's orders
        try {
            $todayOrders = DB::table('orders')
                ->where('branch_id', $branch->id)
                ->whereDate('created_at', $today)
                ->get();
            $result['today_orders_count'] = $todayOrders->count();
        } catch (\Exception $e) {
            $result['today_orders_error'] = $e->getMessage();
        }
        
        // Test the exact query from getTodaySummary
        try {
            $summaryQuery = DB::table('orders')
                ->where('branch_id', $branch->id)
                ->whereDate('created_at', $today)
                ->select(DB::raw('COUNT(*) as total_orders, SUM(total_amount) as total_sales, AVG(total_amount) as avg_order'))
                ->first();
            $result['summary'] = $summaryQuery;
        } catch (\Exception $e) {
            $result['summary_error'] = $e->getMessage();
        }
        
        return response()->json($result);
        
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});