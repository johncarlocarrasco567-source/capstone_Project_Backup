<?php
// database/migrations/2024_01_01_000002_create_branches_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBranchesTable extends Migration
{
    public function up()
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('location', 255);
            $table->enum('type', ['company', 'franchise'])->default('company');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('branches');
    }
}