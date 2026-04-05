<?php
// app/Models/Product.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = ['category_id', 'name', 'price', 'image', 'type'];
    
    protected $casts = [
        'price' => 'decimal:2',
        'type' => 'string',
    ];
    
    public function category()
    {
        return $this->belongsTo(Category::class);
    }
    
    public function recipes()
    {
        return $this->hasMany(ProductRecipe::class);
    }
    
    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class, 'product_recipes')
                    ->withPivot('quantity_needed')
                    ->withTimestamps();
    }
    
    public function branchProducts()
    {
        return $this->hasMany(BranchProduct::class);
    }
    
    public function productStocks()
    {
        return $this->hasMany(ProductStock::class);
    }
    
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
    
    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'branch_products')
                    ->withPivot('is_available')
                    ->withTimestamps();
    }
    
    public function isIngredientBased()
    {
        return $this->type === 'ingredient_based';
    }
    
    public function isStockBased()
    {
        return $this->type === 'stock_based';
    }
    
    public function getRecipeIngredients()
    {
        return $this->recipes()->with('ingredient')->get();
    }
    
    public function getCurrentStock($branchId)
    {
        if ($this->isStockBased()) {
            $stock = $this->productStocks()
                ->where('branch_id', $branchId)
                ->first();
            return $stock ? $stock->quantity : 0;
        }
        
        return null;
    }
    
    public function isAvailableAtBranch($branchId)
    {
        $branchProduct = $this->branchProducts()
            ->where('branch_id', $branchId)
            ->first();
            
        return $branchProduct && $branchProduct->is_available;
    }

public function getImageUrlAttribute()
{
    if (!$this->image) {
        return null;
    }
    
    // If it's already a full URL (for backward compatibility)
    if (filter_var($this->image, FILTER_VALIDATE_URL)) {
        // Check if it's a valid URL
        if (strpos($this->image, 'storage/products/') !== false) {
            return $this->image;
        }
        return $this->image;
    }
    
    // If it contains Windows path separators, it's corrupted
    if (strpos($this->image, ':\\') !== false || strpos($this->image, 'tmp') !== false) {
        \Log::warning('Corrupted image path detected:', ['image' => $this->image]);
        return null;
    }
    
    // Generate proper storage URL
    return asset('storage/products/' . $this->image);
}
}