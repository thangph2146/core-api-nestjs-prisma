import { applyDecorators, SetMetadata } from '@nestjs/common';

// Error handling decorators
export function HandleErrors(errorMessage?: string) {
  return applyDecorators(
    SetMetadata('errorMessage', errorMessage || 'An error occurred')
  );
}

// Common operation decorators
export function CreateOperation(entityName: string) {
  return applyDecorators(
    SetMetadata('operation', `Create ${entityName}`),
    HandleErrors(`Failed to create ${entityName}`)
  );
}

export function FindAllOperation(entityName: string) {
  return applyDecorators(
    SetMetadata('operation', `Get all ${entityName}s`),
    HandleErrors(`Failed to retrieve ${entityName}s`)
  );
}

export function FindOneOperation(entityName: string) {
  return applyDecorators(
    SetMetadata('operation', `Get ${entityName} by ID`),
    HandleErrors(`${entityName} not found`)
  );
}

export function UpdateOperation(entityName: string) {
  return applyDecorators(
    SetMetadata('operation', `Update ${entityName}`),
    HandleErrors(`Failed to update ${entityName}`)
  );
}

export function DeleteOperation(entityName: string) {
  return applyDecorators(
    SetMetadata('operation', `Delete ${entityName}`),
    HandleErrors(`Failed to delete ${entityName}`)
  );
}

export function BulkOperation(operation: string, entityName: string) {
  return applyDecorators(
    SetMetadata('operation', `${operation} multiple ${entityName}s`),
    HandleErrors(`Failed to ${operation.toLowerCase()} ${entityName}s`)
  );
}
