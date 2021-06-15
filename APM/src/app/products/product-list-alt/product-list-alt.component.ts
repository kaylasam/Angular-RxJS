import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

import { EMPTY, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Product } from '../product';
import { ProductService } from '../product.service';

@Component({
  selector: 'pm-product-list',
  templateUrl: './product-list-alt.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListAltComponent {
  pageTitle = 'Products';
  private errorMessageSubject = new Subject<string>();        // creating subject for error message
  errorMessage$ = this.errorMessageSubject.asObservable();      // exposing the observable

  products$ = this.productService.productsWithCategory$.pipe (
    catchError( err => {          // catch and replace error handling
      this.errorMessageSubject.next(err); 
      return EMPTY; }             // if error is caught, products$ will be assigned EMPTY
    )
  );

  selectedProduct$ = this.productService.selectedProduct$;      // stream that emits the selected product whenever it changes and makes button blue

  constructor(private productService: ProductService) { }

  onSelected(productId: number): void {
    this.productService.selectedProductChanged(productId);        // when user clicks on product button, selectedProductChanged in the service is called
  }
}
