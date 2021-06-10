import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, combineLatest, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { Product } from './product';
import { Supplier } from '../suppliers/supplier';
import { SupplierService } from '../suppliers/supplier.service';
import { ProductCategoryService } from '../product-categories/product-category.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsUrl = 'api/products';             // acting as back end web service
  private suppliersUrl = this.supplierService.suppliersUrl;

  products$ = this.http.get<Product[]>(this.productsUrl)
  .pipe(
    tap(data => console.log('Products: ', JSON.stringify(data))),
    catchError(this.handleError)      // catching error and rethrowing error
  );

  productsWithCategory$ = combineLatest([
    this.products$,
    this.productCategoryService.productCategories$
  ]).pipe(
    map(([products, categories]) => 
    products.map(product => ({
      ...product,
      price: product.price * 1.5,
      categoryName: categories.find(c => product.categoryId === c.id).name,
      searchKey: [product.productName]
    }) as Product)
    )
  );

  // first step for reacting to actions: create action stream
  private productSelectedSubject = new BehaviorSubject<number>(0);      // behavior subject is used to ensure action stream emits at least once
  productSelectedAction$ = this.productSelectedSubject.asObservable(); // expose the subjects observable

  // second step for reacting to actions: combine action stream w/ data stream
  selectedProduct$ = combineLatest([
    this.productsWithCategory$,     // use productsWithCategory$ bc we want to display the category string
    this.productSelectedAction$     // pipeline will react when a product is selected
  ])
    .pipe(
      map(([products, selectedProductId]) =>      // array destructuring: first observable emits array of products, second emits the selected product id
        products.find(product => product.id === selectedProductId)      // finds product that matches the selected product id
        ),
        tap(product => console.log('selectedProduct', product))
    );

  constructor(private http: HttpClient,
              private productCategoryService: ProductCategoryService,
              private supplierService: SupplierService) { }

  selectedProductChanged(selectedProductId: number): void {       // takes in selectedProductId and uses .next to pass to the productSelectedAction action stream
    this.productSelectedSubject.next(selectedProductId)
  }

  private fakeProduct(): Product {
    return {
      id: 42,
      productName: 'Another One',
      productCode: 'TBX-0042',
      description: 'Our new product',
      price: 8.9,
      categoryId: 3,
      // category: 'Toolbox',
      quantityInStock: 30
    };
  }

  private handleError(err: any): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
    }
    console.error(err);
    return throwError(errorMessage);
  }

}
