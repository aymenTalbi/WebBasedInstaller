﻿import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

import {
    TabViewModule,
    PanelModule,
    InputTextModule,
    InputSwitchModule,
    ButtonModule,
    PasswordModule    
}
    from 'primeng/primeng';

import { IVersion } from './version';
import { IStatus } from './status';
import { InstallWizardService } from './installWizard.service';
import { panelType } from './panelType';
import { IConnectionSetting } from './connectionSetting';
import { IAuthentication } from './authentication';

import { IUser } from '../user/user';
import { UserService } from '../user/user.service';

@Component({
    selector: 'version-detail',
    templateUrl: 'app/installWizard/installWizard.component.html'
})
export class InstallWizardComponent implements OnInit {
    pageTitle: string = 'Current User';
    version: IVersion;
    errorMessage: string;

    user: IUser;

    DatabaseName: string = "InstallWizard";
    ServerName: string = "(local)";
    IntegratedSecurity: boolean = false;
    Username: string = "sqluser";
    Password: string = "password";
    CreateAdminPassword: string = "Password#1";
    CreateAdminEmail: string = "Admin@Admin.com";
    AdminEmail: string = "Admin@Admin.com";
    AdminPassword: string = "Password#1";

    DatabaseConnectionMessage: string = "";
    InstallStatus: string = "Installing Scripts...";

    DatabaseConfigurationPanel_Disabled: boolean = false;
    DatabaseConfigurationPanel_Selected: boolean = true;
    AdministratorCreationPanel_Selected: boolean = true;
    AdministratorCreationPanel_Disabled: boolean = false;
    AdministratorLoginPanel_Selected: boolean = true;
    AdministratorLoginPanel_Disabled: boolean = false;
    InstallScriptsPanel_Disabled: boolean = true;
    InstallScriptsPanel_Selected: boolean = false;

    // Register the service
    constructor(
        private _installWizardService: InstallWizardService,
        private _userService: UserService,
        private _router: Router) {
    }

    ngOnInit(): void {
        // Call the method that get database status
        // and set the active panel
        this.getDatabaseStatus();
    }

    getDatabaseStatus() {
        // Call the service to get the current database status
        // if isNewDatabase is returned it means version table does not exist
        this._installWizardService.getCurrentVersion().subscribe(
            version => {
                this.version = version;
                if (this.version.isNewDatabase) {
                    // The database is not set up
                    this.setActvePanel(panelType.DatabaseConfiguration);
                }
                else {
                    // The database is set up
                    if (this.version.isUpToDate) {
                        // Everything is set up
                        // Show the Products application
                        this._router.navigateByUrl('/products');
                    }
                    else {
                        // Administrator must log in to continue
                        this.setActvePanel(panelType.AdministratorLogin);
                    }
                }
            },
            error => this.errorMessage = <any>error);
    }

    getCurrentUser() {
        // Call the service
        this._userService.getCurrentUser().subscribe(
            user => this.user = user,
            error => this.errorMessage = <any>error);
    }

    // Events

    setConnection() {    
        this.errorMessage = "";
        // Create a ConnectionSettings object
        let ConnectionSetting: IConnectionSetting = {
            DatabaseName: this.DatabaseName,
            ServerName: this.ServerName,
            IntegratedSecurity: this.IntegratedSecurity,
            Username: this.Username,
            Password: this.Password
        }

        // Call the service 
        this._installWizardService.setConnection(ConnectionSetting).subscribe(
            response => {
                this.DatabaseConnectionMessage = response; 

                if (this.DatabaseConnectionMessage == "Success") {
                    // Move to the next step
                    this.setActvePanel(panelType.AdministratorCreation);
                } else {
                    alert(this.DatabaseConnectionMessage);
                }                               
            },
            error => this.errorMessage = <any>error);
    }

    createAdministrator() {
        this.errorMessage = "";
        let email = this.CreateAdminEmail;
        let password = this.CreateAdminPassword;

        if (this.validatePassword(password) &&
            this.validateEmail(email)) {            

            let Authentication: IAuthentication = {
                Email: email,
                Password: password
            };

            // Call the service
            this._installWizardService.createAdmin(Authentication).subscribe(
                response => {
                    // Call the method to see who 
                    // the server-side OData code 
                    // thinks is logged in
                    this.getCurrentUser();

                    // Move to the next step
                    this.setActvePanel(panelType.AdministratorLogin)
                },
                error => this.errorMessage = <any>error);
        }
        else {
            alert('password [ ' + password + ' ] is not strong enough');
        }
    }

    logInAdmin() {
        this.errorMessage = "";
        // Get the form values
        let email = this.AdminEmail;
        let password = this.AdminPassword;

        let Authentication: IAuthentication = {
            Email: email,
            Password: password
        };

        // Call the service
        this._installWizardService.loginAdmin(Authentication).subscribe(
            response => {
                // A successful login returns a 200
                if (response == "200") {
                    // Switch to running scripts panel
                    this.setActvePanel(panelType.InstallScripts);

                    // Call the update database method
                    this._installWizardService.updateDatabase().subscribe(
                        response => {
                            if (response.Success) {
                                this.InstallStatus = "Complete!";
                            }
                            else {
                                alert(response.StatusMessage);
                            }
                        },
                        error => this.errorMessage = <any>error);

                }
                else {
                    alert('Login failure code: ' + response);
                }
            },
            error => this.errorMessage = <any>error);
    }

    CompleteWizard() {
        // Call getDatabaseStatus
        // This should trigger navigation to
        // the Products application
        this.getDatabaseStatus();
    }

    // Utility

    setActvePanel(panel: panelType) {
        this.errorMessage = "";
        // First set everything to false
        this.DatabaseConfigurationPanel_Disabled = false;
        this.DatabaseConfigurationPanel_Selected = false;
        this.AdministratorCreationPanel_Disabled = false;
        this.AdministratorCreationPanel_Selected = false;
        this.AdministratorLoginPanel_Disabled = false;
        this.AdministratorLoginPanel_Selected = false;
        this.InstallScriptsPanel_Disabled = false;
        this.InstallScriptsPanel_Selected = false;

        switch (panel) {
            case (panel = panelType.DatabaseConfiguration): 
                this.DatabaseConfigurationPanel_Selected = true;                
                this.AdministratorCreationPanel_Disabled = true;
                this.AdministratorLoginPanel_Disabled = true;
                this.InstallScriptsPanel_Disabled = true;
                break;
            case (panel = panelType.AdministratorCreation):
                this.AdministratorCreationPanel_Selected = true;
                this.DatabaseConfigurationPanel_Disabled = true;
                this.AdministratorLoginPanel_Disabled = true;
                this.InstallScriptsPanel_Disabled = true;
                break;
            case (panel = panelType.AdministratorLogin):
                this.AdministratorLoginPanel_Selected = true;
                this.DatabaseConfigurationPanel_Disabled = true;
                this.AdministratorCreationPanel_Disabled = true; 
                this.InstallScriptsPanel_Disabled = true;
                break;
            case (panel = panelType.InstallScripts): 
                this.InstallScriptsPanel_Selected = true;
                this.DatabaseConfigurationPanel_Disabled = true;
                this.AdministratorCreationPanel_Disabled = true; 
                this.AdministratorLoginPanel_Disabled = true;               
                break;
            default:
                this.DatabaseConfigurationPanel_Selected = true;
                this.InstallScriptsPanel_Disabled = true;
        }  
    }

    validatePassword(paramPassword: string): boolean {
        // Validate that one of each required 
        // character is in the password
        var boolContainsNumber: boolean = false;
        var boolContainsNonLetter: boolean = false;
        var boolContainsUppercase: boolean = false;
        var boolIsEightChracters: boolean = false;

        let listOfNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        let listOfNonLetters = ['~','!','@','#','$','%','^','&','*','(', ')','_', '-','+','?','<','>','[',']','{','}','|',';'];
        let listOfUppercase = ['Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','Z','X','C','V','B','N','M'];

        for (let number of listOfNumbers) {
            if (paramPassword.indexOf(number.toString()) > -1) {
                boolContainsNumber = true;
            }
        }

        for (let nonLetter of listOfNonLetters) {
            if (paramPassword.indexOf(nonLetter) > -1) {
                boolContainsNonLetter = true;
            }
        }

        for (let upperCase of listOfUppercase) {
            if (paramPassword.indexOf(upperCase) > -1) {
                boolContainsUppercase = true;
            }
        }

        boolIsEightChracters = (paramPassword.length > 7);

        return (boolContainsNumber && boolContainsNonLetter && boolContainsUppercase && boolIsEightChracters);
    }

    validateEmail(paramEmail: string): boolean {
        // Validate email

        let boolIsFiveChracters: boolean = (paramEmail.length > 4);
        let boolContainsAmpersand: boolean = (paramEmail.indexOf("@") > -1);
        let boolContainsPeriod: boolean = (paramEmail.indexOf(".") > -1);

        return (boolIsFiveChracters && boolContainsAmpersand && boolContainsPeriod);
    }
}