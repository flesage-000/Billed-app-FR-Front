/**
 * @jest-environment jsdom
 */

 import {fireEvent, screen, waitFor} from "@testing-library/dom"
 import BillsUI from "../views/BillsUI.js"
 import { bills } from "../fixtures/bills.js"
 import Bills from "../containers/Bills.js";
 import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
 import { localStorageMock } from "../__mocks__/localStorage.js";
 import mockStore from "../__mocks__/store";

 import router from "../app/Router.js";

 describe("Given I am connected as an employee", () => {
   describe("When I am on Bills Page", () => {
     test("Then bill icon in vertical layout should be highlighted", async () => {

       Object.defineProperty(window, 'localStorage', { value: localStorageMock })
       window.localStorage.setItem('user', JSON.stringify({
         type: 'Employee'
       }))
       const root = document.createElement("div")
       root.setAttribute("id", "root")
       document.body.append(root)
       router()
       window.onNavigate(ROUTES_PATH.Bills)
       await waitFor(() => screen.getByTestId('icon-window'))
       const windowIcon = screen.getByTestId('icon-window')
       //to-do write expect expression
       expect(windowIcon.getAttribute("class")).toMatch(/active-icon/gi)
     })
     test("Then bills should be ordered from earliest to latest", () => {
       document.body.innerHTML = BillsUI({ data: bills })
       const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
       const antiChrono = (a, b) => { (new Date(a.date) < new Date(b.date)) ? 1 : -1 }
       const datesSorted = [...dates].sort(antiChrono)
       expect(dates).toEqual(datesSorted)
     })
   })

   describe("When I click on new bill", () => {
     test("Then the form to create a new bill appear", async () => {
       const onNavigate = (pathname) => {
         document.body.innerHTML = ROUTES({ pathname })
       }
       Object.defineProperty(window, "localStorage", { value: localStorageMock })
       window.localStorage.setItem("user", JSON.stringify({
         type: "Employee"
       }))
       const billsInit = new Bills({
         document, onNavigate, store: null, localStorage: window.localStorage
       })
       document.body.innerHTML = BillsUI({ data: bills })
       const handleClickNewBill = jest.fn(() => billsInit.handleClickNewBill ())
       const btnNewBill = screen.getByTestId("btn-new-bill")
       btnNewBill.addEventListener("click", handleClickNewBill)
       fireEvent.click(btnNewBill)
       expect(handleClickNewBill).toHaveBeenCalled()
       await waitFor(() => screen.getByTestId("form-new-bill"))
       expect(screen.getByTestId("form-new-bill")).toBeTruthy()
     })
   })

   describe("When I click on eye icon", () => {
     test("Then a modal must appear", async () => {
       const onNavigate = (pathname) => {
         document.body.innerHTML = ROUTES({ pathname })
       }
       Object.defineProperty(window, "localStorage", { value: localStorageMock })
       window.localStorage.setItem("user", JSON.stringify({
         type: "Employee"
       }))
       const billsInit = new Bills({
         document, onNavigate, store: null, localStorage: window.localStorage
       })
       document.body.innerHTML = BillsUI({ data: bills })
       const handleClickIconEye = jest.fn((icon) => billsInit.handleClickIconEye(icon));
       const iconEye = screen.getAllByTestId(/icon-eye/);
       const modaleFile = document.getElementById("modaleFile")
       $.fn.modal = jest.fn(() => modaleFile.classList.add("show"))
       iconEye.forEach((icon) => {
         icon.addEventListener("click", handleClickIconEye(icon))
         fireEvent.click(icon)
         expect(handleClickIconEye).toHaveBeenCalled()
       })
       expect(modaleFile.getAttribute('class')).toMatch(/show/gi)
     })
   })

   describe("When I navigate to Bills", () => {
     test("Then the page show", async () => {
       const onNavigate = (pathname) => {
         document.body.innerHTML = ROUTES({ pathname })
       }
       Object.defineProperty(window, "localStorage", { value: localStorageMock })
       window.localStorage.setItem("user", JSON.stringify({
         type: "Employee"
       }))
       new Bills({
         document, onNavigate, store: null, localStorage: window.localStorage
       })
       document.body.innerHTML = BillsUI({ data: bills })
       await waitFor(() => screen.getByText("Mes notes de frais"))
       expect(screen.getByText("Mes notes de frais")).toBeTruthy()
     })
   })


   // Test d'intégration
   describe("When an error occurs on API", () => {
     beforeEach(() => {
       jest.spyOn(mockStore, "bills")
       Object.defineProperty(
           window,
           "localStorage",
           { value: localStorageMock }
       );
       window.localStorage.setItem("user", JSON.stringify({
         type: "Employee",
         email: "a@a"
       }));
       const root = document.createElement("div");
       root.setAttribute("id", "root");
       document.body.appendChild(root);
       router();
     })
     // Check 404 error
     test("Then fetches bills from an API and fails with 404 message error", async () => {
       mockStore.bills.mockImplementationOnce(() => {
         return {
           list : () =>  {
             return Promise.reject(new Error("Erreur 404"))
           }
         }
       })
       const html = BillsUI({ error: "Erreur 404" });
       document.body.innerHTML = html;
       const message = await screen.getByText(/Erreur 404/);
       expect(message).toBeTruthy();
     })
   // Check 500 error
     test("Then fetches messages from an API and fails with 500 message error", async () => {
       mockStore.bills.mockImplementationOnce(() => {
         return {
           list : () =>  {
             return Promise.reject(new Error("Erreur 500"))
           }
         }
       })
       const html = BillsUI({ error: "Erreur 500" });
       document.body.innerHTML = html;
       const message = await screen.getByText(/Erreur 500/);
       expect(message).toBeTruthy();
     })
   })
 })