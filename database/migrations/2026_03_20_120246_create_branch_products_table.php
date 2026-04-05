<?php
// database/migrations/2024_01_01_000009_create_branch_products_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBranchProductsTable extends Migration
{
    public function up()
    {
        Schema::create('branch_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->boolean('is_available')->default(true);
            $table->timestamps();
            
            $table->unique(['branch_id', 'product_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('branch_products');
    }
}