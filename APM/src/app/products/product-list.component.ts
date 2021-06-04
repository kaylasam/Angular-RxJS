import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ProductCategoryService } from '../product-categories/product-category.service';

import { Product } from './product';
import { ProductService } from './product.service';

@Component({
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent{
  pageTitle = 'Product List';
  errorMessage = '';
  categories;
  selectedCategoryId = 1;

  //defining categories stream and assigning to categories observable defined in product category service
  categories$ = this.productCategoryService.productCategories$
    .pipe(
        catchError(err => {
            this.errorMessage = err;
            return EMPTY;   //returns nothing if there is an error
        })
    );

  products$ = this.productService.productsWithCategory$.pipe(     // instead of product$ observable, this observable is identical except it provides the category property
    catchError(err => {           //catch and replace
      this.errorMessage = err;
      return EMPTY;               // returns observable that emits empty array
    })
  );

  productSimpleFilter$ = this.productService.productsWithCategory$
    .pipe (
      map(products => 
        products.filter(product =>
          this.selectedCategoryId ? product.categoryId === this.selectedCategoryId : true
          ))
    );

  constructor(private productService: ProductService, private productCategoryService: ProductCategoryService) { }

  onAdd(): void {
    console.log('Not yet implemented');
  }

  onSelected(categoryId: string): void {
    this.selectedCategoryId = +categoryId; 
  }
}
