<?php
// app/Http/Controllers/AuthController.php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Http\Resources\UserResource;

class AuthController extends Controller
{
    /**
     * Login and return user with role-specific dashboard data
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);
        
        $user = User::with(['role', 'branch'])->where('email', $request->email)->first();
        
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }
        
        // Create token
        $token = $user->createToken('auth_token')->plainTextToken;
        
        // Return role-specific response
        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
            'role' => $user->role->name,
            'redirect_to' => $this->getDashboardRoute($user->role->name)
        ]);
    }
    
    /**
     * Get dashboard data based on user role
     */
    public function getDashboard(Request $request)
    {
        $user = $request->user();
        
        switch ($user->role->name) {
            case 'Super Admin':
                return app(\App\Http\Controllers\SuperAdmin\DashboardController::class)
                    ->index($request);
            case 'Admin':
                return app(\App\Http\Controllers\Admin\DashboardController::class)
                    ->index($request);
            case 'Staff':
                return app(\App\Http\Controllers\Staff\POSController::class)
                    ->getProducts($request);
            default:
                return response()->json(['message' => 'Unauthorized'], 403);
        }
    }
    
    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        
        return response()->json(['message' => 'Logged out successfully']);
    }
    
    /**
     * Get current user
     */
    public function me(Request $request)
    {
        return response()->json(new UserResource($request->user()->load(['role', 'branch'])));
    }
    
    private function getDashboardRoute($role)
    {
        return match($role) {
            'Super Admin' => '/super-admin/dashboard',
            'Admin' => '/admin/dashboard',
            'Staff' => '/staff/pos',
            default => '/login'
        };
    }
}