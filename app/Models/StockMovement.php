<?php
// app/Models/StockMovement.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'branch_id', 'ingredient_id', 'order_id', 'type', 
        'quantity', 'previous_quantity', 'new_quantity', 
        'notes', 'created_by'
    ];
    
    protected $casts = [
        'quantity' => 'decimal:2',
        'previous_quantity' => 'decimal:2',
        'new_quantity' => 'decimal:2'
    ];
    
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
    
    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }
    
    public function order()
    {
        return $this->belongsTo(Order::class);
    }
    
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopePurchases($query)
{
    return $query->where('type', 'purchase');
}

public function scopeUsage($query)
{
    return $query->where('type', 'usage');
}

public function scopeWaste($query)
{
    return $query->where('type', 'waste');
}

public function scopeAdjustments($query)
{
    return $query->where('type', 'adjustment');
}

public function scopeForBranch($query, $branchId)
{
    return $query->where('branch_id', $branchId);
}

public function scopeForIngredient($query, $ingredientId)
{
    return $query->where('ingredient_id', $ingredientId);
}

public function scopeBetweenDates($query, $startDate, $endDate)
{
    return $query->whereBetween('created_at', [$startDate, $endDate]);
}
}