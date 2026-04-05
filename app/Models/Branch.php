<?php
// app/Models/Branch.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $fillable = ['name', 'location', 'type'];
    
    protected $casts = [
        'type' => 'string',
    ];
    
    public function users()
    {
        return $this->hasMany(User::class);
    }
    
    public function branchIngredients()
    {
        return $this->hasMany(BranchIngredient::class);
    }
    
    public function branchProducts()
    {
        return $this->hasMany(BranchProduct::class);
    }
    
    public function productStocks()
    {
        return $this->hasMany(ProductStock::class);
    }
    
    public function orders()
    {
        return $this->hasMany(Order::class);
    }
    
    public function reports()
    {
        return $this->hasMany(Report::class);
    }
    
    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class, 'branch_ingredients')
                    ->withPivot('quantity')
                    ->withTimestamps();
    }
    
    public function products()
    {
        return $this->belongsToMany(Product::class, 'branch_products')
                    ->withPivot('is_available')
                    ->withTimestamps();
    }
    
    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }
    
    public function isFranchise()
    {
        return $this->type === 'franchise';
    }

    
public function categories()
{
    return $this->belongsToMany(Category::class, 'branch_category')
                ->withPivot('is_active')
                ->withTimestamps();
}

public function activeCategories()
{
    return $this->belongsToMany(Category::class, 'branch_category')
                ->withPivot('is_active')
                ->wherePivot('is_active', true)
                ->withTimestamps();
}
}