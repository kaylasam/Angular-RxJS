import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, combineLatest, from, merge, Observable, Subject, throwError } from 'rxjs';
import { catchError, filter, map, mergeMap, scan, shareReplay, switchMap, tap, toArray } from 'rxjs/operators';

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
    ),
    shareReplay(1)
  );

  // first step for reacting to actions: create action stream (for product list filtering)
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
        tap(product => console.log('selectedProduct', product)),
        shareReplay(1)
    );

  private productInsertedSubject = new Subject<Product>();      // adding a new product to the stream
  productInsertedAction$ = this.productInsertedSubject.asObservable();      // expose the observable
  
  // combine action stream to add product w data stream of current products
  productsWithAdd$ = merge(
    this.productsWithCategory$,
    this.productInsertedAction$
  ).pipe(
    scan((acc: Product[], value: Product) => [...acc, value])     // takes in accumulator of type Product[] and value of type Product and creates a new 
                                                                  // array taking the exact copy of Product[] in acc and adding the Product from value 
  );

  // selectedProductSuppliers$ = combineLatest([
  //   this.selectedProduct$,                      // combines the selectedProduct action observable w the suppliers observable
  //   this.supplierService.suppliers$
  // ]).pipe(
  //   map(([selectedProduct, suppliers]) =>       // array destructuring to assign variables to the emissions from the input stream
  //   suppliers.filter(supplier => selectedProduct.supplierIds.includes(supplier.id))         // filters the suppliers array to include only those suppliers that are in the array of supplierIds
  //   )
  // );

  // just in time approach
  selectedProductSuppliers$ = this.selectedProduct$
    .pipe(
      filter(selectedProduct => Boolean(selectedProduct)),        // skips the process of deciding if a selected product is null or not
      // using switchMap to get the data for the most recently selected product
      switchMap(selectedProduct =>               // creating an inner observable from the array of supplier ids for the product
        from(selectedProduct.supplierIds)
        .pipe(
          // we dont use switchMap here bc we want to retrieve ALL of the suppliers
          mergeMap(supplierId => this.http.get<Supplier>(`${this.suppliersUrl}/${supplierId}`)),        // issues an http get request for each supplier id and merges w the stream of individual suppliers
          toArray(),       // presents emissions as a single array
          tap(suppliers => console.log('product suppliers', JSON.stringify(suppliers)))
        ))
    );

  constructor(private http: HttpClient,
              private productCategoryService: ProductCategoryService,
              private supplierService: SupplierService) { }
  
  // third step for reacting to actions: emit a value to the action stream when an action occurs
  selectedProductChanged(selectedProductId: number): void {       // takes in selectedProductId and uses .next to pass to the productSelectedAction action stream
    this.productSelectedSubject.next(selectedProductId)
  }

  addProduct(newProduct?: Product){
    newProduct = newProduct || this.fakeProduct();        // assigns newProduct value of newProduct or fakeProduct if it is NULL
    this.productInsertedSubject.next(newProduct);         // call .next on the action stream to emit that new product
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
