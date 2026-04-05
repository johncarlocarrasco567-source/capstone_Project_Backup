<?php
// app/Http/Controllers/Admin/StaffController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class StaffController extends Controller
{
    /**
     * List staff members
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $branch = $user->branch;
        
        $staff = $branch->users()
            ->whereHas('role', function($q) {
                $q->where('name', 'Staff');
            })
            ->withCount(['orders' => function($q) {
                $q->whereDate('created_at', now()->toDateString());
            }])
            ->withSum(['orders as today_sales' => function($q) {
                $q->whereDate('created_at', now()->toDateString());
            }], 'total_amount')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($staff) {
                return [
                    'id' => $staff->id,
                    'name' => $staff->name,
                    'email' => $staff->email,
                    'orders_today' => $staff->orders_count,
                    'sales_today' => $staff->today_sales ?? 0,
                    'created_at' => $staff->created_at
                ];
            });
            
        return response()->json($staff);
    }
    
    /**
     * Create new staff member
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6'
        ]);
        
        $user = Auth::user();
        
        $staff = User::create([
            'branch_id' => $user->branch_id,
            'role_id' => 3, // Staff role ID
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password)
        ]);
        
        return response()->json([
            'message' => 'Staff created successfully',
            'staff' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email
            ]
        ], 201);
    }
    
    /**
     * Update staff member
     */
    public function update(Request $request, User $staff)
    {
        $request->validate([
            'name' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|unique:users,email,' . $staff->id,
            'password' => 'sometimes|string|min:6'
        ]);
        
        $data = $request->only(['name', 'email']);
        
        if ($request->has('password')) {
            $data['password'] = Hash::make($request->password);
        }
        
        $staff->update($data);
        
        return response()->json([
            'message' => 'Staff updated successfully',
            'staff' => $staff
        ]);
    }
    
    /**
     * Delete staff member
     */
    public function destroy(User $staff)
    {
        // Check if staff has orders
        if ($staff->orders()->exists()) {
            return response()->json([
                'message' => 'Cannot delete staff with existing orders'
            ], 400);
        }
        
        $staff->delete();
        
        return response()->json([
            'message' => 'Staff deleted successfully'
        ]);
    }
    
    /**
     * Get staff performance details
     */
    public function show(User $staff)
    {
        $performance = [
            'staff' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
                'created_at' => $staff->created_at
            ],
            'today' => [
                'orders' => $staff->orders()->whereDate('created_at', today())->count(),
                'sales' => $staff->orders()->whereDate('created_at', today())->sum('total_amount')
            ],
            'this_week' => [
                'orders' => $staff->orders()->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
                'sales' => $staff->orders()->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->sum('total_amount')
            ],
            'this_month' => [
                'orders' => $staff->orders()->whereMonth('created_at', now()->month)->count(),
                'sales' => $staff->orders()->whereMonth('created_at', now()->month)->sum('total_amount')
            ],
            'recent_orders' => $staff->orders()
                ->with('items.product')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($order) {
                    return [
                        'id' => $order->id,
                        'total' => $order->total_amount,
                        'items' => $order->items->count(),
                        'created_at' => $order->created_at
                    ];
                })
        ];
        
        return response()->json($performance);
    }
}