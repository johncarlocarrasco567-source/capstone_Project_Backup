<?php
// app/Models/Order.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'branch_id', 'staff_id', 'total_amount', 'payment', 'change_amount'
    ];
    
    protected $casts = [
        'total_amount' => 'decimal:2',
        'payment' => 'decimal:2',
        'change_amount' => 'decimal:2',
    ];
    
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
    
    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }
    
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
    
    public function products()
    {
        return $this->belongsToMany(Product::class, 'order_items')
                    ->withPivot('quantity', 'price')
                    ->withTimestamps();
    }
    
    // Scope for date filtering
    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }
    
    public function scopeThisWeek($query)
    {
        return $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
    }
    
    public function scopeThisMonth($query)
    {
        return $query->whereMonth('created_at', now()->month);
    }
    
    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function stockMovements()
{
    return $this->hasMany(StockMovement::class);
}

public function scopeBetweenDates($query, $startDate, $endDate)
{
    return $query->whereBetween('created_at', [$startDate, $endDate]);
}
}