<?php
// app/Http/Middleware/RoleMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!Auth::check()) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        
        $user = Auth::user();
        $userRole = $user->role->name;
        
        if (!in_array($userRole, $roles)) {
            return response()->json(['message' => 'Forbidden - Insufficient permissions'], 403);
        }
        
        return $next($request);
    }
}