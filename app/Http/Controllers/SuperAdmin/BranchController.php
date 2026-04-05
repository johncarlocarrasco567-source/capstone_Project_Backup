<?php
// app/Http/Controllers/SuperAdmin/BranchController.php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\User;
use App\Http\Resources\BranchResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class BranchController extends Controller
{
    /**
     * List all branches
     */
    public function index(Request $request)
    {
        $branches = Branch::withCount(['users', 'orders'])
            ->when($request->type, function($query, $type) {
                return $query->where('type', $type);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));
            
        return BranchResource::collection($branches);
    }
    
    /**
     * Create new branch
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'location' => 'required|string|max:255',
            'type' => 'required|in:company,franchise'
        ]);
        
        $branch = Branch::create($request->all());
        
        return response()->json([
            'message' => 'Branch created successfully',
            'branch' => new BranchResource($branch)
        ], 201);
    }
    
    /**
     * Update branch
     */
    public function update(Request $request, Branch $branch)
    {
        $request->validate([
            'name' => 'sometimes|string|max:100',
            'location' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:company,franchise'
        ]);
        
        $branch->update($request->all());
        
        return response()->json([
            'message' => 'Branch updated successfully',
            'branch' => new BranchResource($branch)
        ]);
    }
    
    /**
     * Delete branch
     */
    public function destroy(Branch $branch)
    {
        // Check if branch has orders or users
        if ($branch->orders()->exists() || $branch->users()->exists()) {
            return response()->json([
                'message' => 'Cannot delete branch with existing orders or users'
            ], 400);
        }
        
        $branch->delete();
        
        return response()->json([
            'message' => 'Branch deleted successfully'
        ]);
    }
    
    /**
     * Create admin for branch
     */
    public function createAdmin(Request $request, Branch $branch)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6'
        ]);
        
        $admin = User::create([
            'branch_id' => $branch->id,
            'role_id' => 2, // Admin role ID
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password)
        ]);
        
        return response()->json([
            'message' => 'Admin created successfully',
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email
            ]
        ], 201);
    }
    
    /**
     * Get branch details with inventory and sales
     */
    public function show(Branch $branch)
    {
        $branch->load(['users' => function($query) {
            $query->whereHas('role', function($q) {
                $q->where('name', 'Admin');
            });
        }]);
        
        $stats = [
            'total_staff' => $branch->users()->whereHas('role', function($q) {
                $q->where('name', 'Staff');
            })->count(),
            'total_orders' => $branch->orders()->count(),
            'total_sales' => $branch->orders()->sum('total_amount'),
            'available_products' => $branch->branchProducts()->where('is_available', true)->count(),
            'low_stock_ingredients' => $branch->branchIngredients()->where('quantity', '<', 10)->count()
        ];
        
        return response()->json([
            'branch' => new BranchResource($branch),
            'stats' => $stats
        ]);
    }
}