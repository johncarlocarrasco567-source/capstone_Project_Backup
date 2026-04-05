<?php
// app/Models/BranchProduct.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BranchProduct extends Model
{
    protected $fillable = ['branch_id', 'product_id', 'is_available'];
    
    protected $casts = [
        'is_available' => 'boolean'
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