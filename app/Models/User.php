<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
    
    protected $fillable = [
        'branch_id', 'role_id', 'name', 'email', 'password',
    ];
    
    protected $hidden = [
        'password', 'remember_token',
    ];
    
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];
    
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
    
    public function role()
    {
        return $this->belongsTo(Role::class);
    }
    
    public function orders()
    {
        return $this->hasMany(Order::class, 'staff_id');
    }
    
    public function reports()
    {
        return $this->hasMany(Report::class, 'admin_id');
    }
    
    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class, 'created_by');
    }
    
    public function isSuperAdmin()
    {
        return $this->role->name === 'Super Admin';
    }
    
    public function isAdmin()
    {
        return $this->role->name === 'Admin';
    }
    
    public function isStaff()
    {
        return $this->role->name === 'Staff';
    }
    
}