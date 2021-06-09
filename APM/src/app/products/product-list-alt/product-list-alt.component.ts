import { Component, OnInit, OnDestroy } from '@angular/core';

import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Product } from '../product';
import { ProductService } from '../product.service';

@Component({
  selector: 'pm-product-list',
  templateUrl: './product-list-alt.component.html'
})
export class ProductListAltComponent {
  pageTitle = 'Products';
  errorMessage = '';
  selectedProductId: number;

  products$ = this.productService.productsWithCategory$.pipe (
    catchError( err => {          // catch and replace error handling
      this.errorMessage = err;    
      return EMPTY; }             // if error is caught, products$ will be assigned EMPTY
    )
  );

  constructor(private productService: ProductService) { }

  onSelected(productId: number): void {
    console.log('Not yet implemented');
  }
}
