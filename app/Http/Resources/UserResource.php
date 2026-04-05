<?php
// app/Http/Resources/UserResource.php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => [
                'id' => $this->role->id,
                'name' => $this->role->name
            ],
            'branch' => $this->branch ? [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
                'location' => $this->branch->location,
                'type' => $this->branch->type
            ] : null,
            'created_at' => $this->created_at
        ];
    }
}