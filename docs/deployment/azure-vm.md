# Azure VM Deployment Guide

## Overview
This document covers the infrastructure setup and deployment process for hosting the application container on an Azure Virtual Machine.

## Infrastructure Setup
- **Resource Group**: Azure Resource Group housing the virtual machine and related network resources.
- **Virtual Machine**: Linux VM instance configured with Docker runtime.
- **Network Security Group (NSG)**: Inbound rules allowing HTTP, HTTPS, and SSH access.

## Deployment Process
1. Provision Azure VM instance.
2. Configure host environment and Docker engine on the VM.
3. Fetch application container image and run application service.

## Verification
- VM instance status and network reachability check.
- Deployment verification logs stored under `docs/evidence/azure-deployment/`.
