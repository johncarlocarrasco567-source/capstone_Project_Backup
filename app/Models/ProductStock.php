<?php
// app/Models/ProductStock.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductStock extends Model
{
    protected $fillable = ['branch_id', 'product_id', 'quantity'];
    
    protected $casts = [
        'quantity' => 'integer'
    ];
    
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
    
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}