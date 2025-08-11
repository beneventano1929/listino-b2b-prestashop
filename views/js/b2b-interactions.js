/**
 * B2B Pricing Management JavaScript Interactions
 * Enhanced version with Customer/Group selection and category-based loading
 */

document.addEventListener('DOMContentLoaded', function() {

    // Initialize all interactive elements
    initializeTargetSelection();
    initializeCustomerSearch();
    initializeSelectAllFunctionality();
    initializeGroupMarginCalculations();
    initializeGlobalMarginApplication();
    initializeToggleModified();
    initializeResetSpecificPrice();
    initializeSaveAll();
    initializeFormValidations();
    initializeTooltips();
    initializeProductSearch();
    initializeFiltering();
    initializeSorting();
    initializeCategoryTreeCheckboxes();


    /**
     * Target Selection (Group/Customer toggle)
     */
    function initializeTargetSelection() {
        const groupRadio = document.getElementById('selectGroup');
        const customerRadio = document.getElementById('selectCustomer');
        const groupSelection = document.getElementById('groupSelection');
        const customerSelection = document.getElementById('customerSelection');

        if (groupRadio && customerRadio) {
            groupRadio.addEventListener('change', function() {
                if (this.checked) {
                    groupSelection.style.display = 'block';
                    customerSelection.style.display = 'none';
                    document.getElementById('selectedCustomerId').value = '';
                    clearCustomerSearch();
                }
            });

            customerRadio.addEventListener('change', function() {
                if (this.checked) {
                    groupSelection.style.display = 'none';
                    customerSelection.style.display = 'block';
                    document.getElementById('groupSelector').value = '0';
                }
            });
        }
    }

    /**
     * Customer Search with AJAX
     */
    function initializeCustomerSearch() {
        const customerSearch = document.getElementById('customerSearch');
        const customerResults = document.getElementById('customerResults');
        const selectedCustomerId = document.getElementById('selectedCustomerId');
        let searchTimeout;

        if (!customerSearch) return;

        customerSearch.addEventListener('input', function() {
            const query = this.value.trim();

            clearTimeout(searchTimeout);

            if (query.length < 2) {
                hideCustomerResults();
                return;
            }

            searchTimeout = setTimeout(() => {
                searchCustomers(query);
            }, 300);
        });

        // Hide results when clicking outside
        document.addEventListener('click', function(e) {
            if (!customerSearch.contains(e.target) && !customerResults.contains(e.target)) {
                hideCustomerResults();
            }
        });

        function searchCustomers(query) {
            // Simulate AJAX call - in real implementation this would call the controller
            fetch(window.location.href, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'ajax=1&action=searchCustomers&query=' + encodeURIComponent(query)
            })
                .then(response => response.json())
                .then(customers => {
                    displayCustomerResults(customers);
                })
                .catch(error => {
                    console.log('Customer search error:', error);
                    // Fallback: show sample results for demo
                    const sampleCustomers = [
                        {
                            id_customer: 1,
                            name: 'Mario Rossi',
                            email: 'mario.rossi@email.com',
                            display_name: 'Mario Rossi (mario.rossi@email.com)'
                        },
                        {
                            id_customer: 2,
                            name: 'Laura Bianchi',
                            email: 'laura.bianchi@email.com',
                            display_name: 'Laura Bianchi (laura.bianchi@email.com)'
                        }
                    ].filter(c => c.name.toLowerCase().includes(query.toLowerCase()) ||
                        c.email.toLowerCase().includes(query.toLowerCase()));

                    displayCustomerResults(sampleCustomers);
                });
        }

        function displayCustomerResults(customers) {
            if (!customers || customers.length === 0) {
                customerResults.innerHTML = '<div class="p-2 text-muted"><small>Nessun cliente trovato</small></div>';
                customerResults.style.display = 'block';
                return;
            }

            const html = customers.map(customer => `
                <div class="customer-result p-2 border-bottom" data-customer-id="${customer.id_customer}" 
                     data-customer-name="${customer.display_name}" style="cursor: pointer;">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-user me-2 text-primary"></i>
                        <div>
                            <div class="fw-semibold">${customer.name}</div>
                            <small class="text-muted">${customer.email}</small>
                        </div>
                    </div>
                </div>
            `).join('');

            customerResults.innerHTML = html;
            customerResults.style.display = 'block';

            // Add click handlers
            customerResults.querySelectorAll('.customer-result').forEach(result => {
                result.addEventListener('click', function() {
                    const customerId = this.dataset.customerId;
                    const customerName = this.dataset.customerName;

                    selectCustomer(customerId, customerName);
                });
            });
        }

        function selectCustomer(customerId, customerName) {
            selectedCustomerId.value = customerId;
            customerSearch.value = customerName;
            hideCustomerResults();

            // Show selected customer info
            showSelectedCustomerInfo(customerName);
        }

        function hideCustomerResults() {
            customerResults.style.display = 'none';
        }

        function clearCustomerSearch() {
            customerSearch.value = '';
            selectedCustomerId.value = '';
            hideSelectedCustomerInfo();
            hideCustomerResults();
        }

        function showSelectedCustomerInfo(customerName) {
            let infoDiv = document.getElementById('selectedCustomerInfo');
            if (!infoDiv) {
                infoDiv = document.createElement('div');
                infoDiv.id = 'selectedCustomerInfo';
                customerSearch.parentNode.appendChild(infoDiv);
            }

            infoDiv.className = 'mt-2 p-2 bg-success bg-opacity-10 border border-success rounded';
            infoDiv.innerHTML = `
                <small class="text-success">
                    <i class="fas fa-check-circle me-1"></i>Cliente selezionato: <strong>${customerName}</strong>
                    <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="clearSelectedCustomer()">
                        <i class="fas fa-times"></i>
                    </button>
                </small>
            `;
        }

        function hideSelectedCustomerInfo() {
            const infoDiv = document.getElementById('selectedCustomerInfo');
            if (infoDiv) {
                infoDiv.remove();
            }
        }

        // Global function to clear selected customer
        window.clearSelectedCustomer = function() {
            clearCustomerSearch();
        };
    }

    /**
     * Product Search Functionality
     */
    function initializeProductSearch() {
        const searchInput = document.getElementById('productSearch');
        const productRows = document.querySelectorAll('.product-row');

        if (!searchInput) return;

        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            let visibleCount = 0;

            productRows.forEach(row => {
                const productId = row.dataset.id;
                const productName = row.dataset.name;

                if (searchTerm === '' ||
                    productId.includes(searchTerm) ||
                    productName.includes(searchTerm)) {
                    row.classList.remove('hidden-by-search');
                    if (!row.classList.contains('hidden-by-filter')) {
                        visibleCount++;
                    }
                } else {
                    row.classList.add('hidden-by-search');
                }
            });

            updateResultsInfo();

            // Visual feedback
            if (searchTerm !== '') {
                searchInput.classList.add('has-results');
                searchInput.classList.remove('no-results');
            } else {
                searchInput.classList.remove('has-results', 'no-results');
            }
        });
    }

    /**
     * Filtering Functionality
     */
    function initializeFiltering() {
        const marginFilter = document.getElementById('marginFilter');
        const clearFiltersBtn = document.getElementById('clearFilters');

        if (marginFilter) {
            marginFilter.addEventListener('change', function() {
                applyMarginFilter(this.value);
                updateResultsInfo();
            });
        }

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', function() {
                // Clear search
                const searchInput = document.getElementById('productSearch');
                if (searchInput) {
                    searchInput.value = '';
                }

                // Clear margin filter
                if (marginFilter) {
                    marginFilter.value = '';
                }

                // Show all rows
                const productRows = document.querySelectorAll('.product-row');
                productRows.forEach(row => {
                    row.classList.remove('hidden-by-search', 'hidden-by-filter');
                });

                updateResultsInfo();
            });
        }
    }

    function applyMarginFilter(filterValue) {
        const productRows = document.querySelectorAll('.product-row');

        productRows.forEach(row => {
            const margin = parseFloat(row.dataset.margin) || 0;
            let shouldShow = true;

            switch(filterValue) {
                case 'above-0':
                    shouldShow = margin > 0;
                    break;
                case 'above-10':
                    shouldShow = margin > 10;
                    break;
                case 'above-20':
                    shouldShow = margin > 20;
                    break;
                case 'above-30':
                    shouldShow = margin > 30;
                    break;
                case 'below-10':
                    shouldShow = margin < 10;
                    break;
                case 'below-20':
                    shouldShow = margin < 20;
                    break;
                case 'no-margin':
                    shouldShow = margin === 0;
                    break;
                default:
                    shouldShow = true;
            }

            if (shouldShow) {
                row.classList.remove('hidden-by-filter');
            } else {
                row.classList.add('hidden-by-filter');
            }
        });
    }

    /**
     * Sorting Functionality
     */
    function initializeSorting() {
        const sortHeaders = document.querySelectorAll('.sortable-header');
        const sortBySelect = document.getElementById('sortBy');
        const sortDirectionBtn = document.getElementById('sortDirection');
        let currentSort = { field: 'id', direction: 'asc' };

        sortHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const sortField = this.dataset.sort;
                if (currentSort.field === sortField) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.field = sortField;
                    currentSort.direction = 'asc';
                }

                sortTable(currentSort.field, currentSort.direction);
                updateSortUI();
            });
        });

        if (sortBySelect) {
            sortBySelect.addEventListener('change', function() {
                currentSort.field = this.value;
                sortTable(currentSort.field, currentSort.direction);
                updateSortUI();
            });
        }

        if (sortDirectionBtn) {
            sortDirectionBtn.addEventListener('click', function() {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                sortTable(currentSort.field, currentSort.direction);
                updateSortUI();
            });
        }

        function sortTable(field, direction) {
            const tbody = document.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('.product-row'));

            rows.sort((a, b) => {
                let aVal, bVal;

                switch(field) {
                    case 'id':
                        aVal = parseInt(a.dataset.id);
                        bVal = parseInt(b.dataset.id);
                        break;
                    case 'name':
                        aVal = a.dataset.name;
                        bVal = b.dataset.name;
                        break;
                    case 'wholesale_price':
                        aVal = parseFloat(a.dataset.wholesalePrice) || 0;
                        bVal = parseFloat(b.dataset.wholesalePrice) || 0;
                        break;
                    case 'price':
                        aVal = parseFloat(a.dataset.price) || 0;
                        bVal = parseFloat(b.dataset.price) || 0;
                        break;
                    case 'margin':
                        aVal = parseFloat(a.dataset.margin) || 0;
                        bVal = parseFloat(b.dataset.margin) || 0;
                        break;
                    case 'b2b_price':
                        aVal = parseFloat(a.dataset.b2bPrice) || 0;
                        bVal = parseFloat(b.dataset.b2bPrice) || 0;
                        break;
                    default:
                        return 0;
                }

                if (typeof aVal === 'string') {
                    return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }

                return direction === 'asc' ? aVal - bVal : bVal - aVal;
            });

            // Reorder rows in DOM
            rows.forEach(row => tbody.appendChild(row));
        }

        function updateSortUI() {
            // Update select
            if (sortBySelect) {
                sortBySelect.value = currentSort.field;
            }

            // Update direction button
            if (sortDirectionBtn) {
                const icon = sortDirectionBtn.querySelector('i');
                icon.className = currentSort.direction === 'asc' ?
                    'fas fa-sort-amount-down' : 'fas fa-sort-amount-up';
            }

            // Update headers
            sortHeaders.forEach(header => {
                header.classList.remove('active');
                if (header.dataset.sort === currentSort.field) {
                    header.classList.add('active');
                }
            });
        }
    }

    /**
     * Update results information
     */
    function updateResultsInfo() {
        const totalCount = document.querySelectorAll('.product-row').length;
        const visibleCount = document.querySelectorAll('.product-row:not(.hidden-by-search):not(.hidden-by-filter)').length;

        const totalCountEl = document.getElementById('totalCount');
        const visibleCountEl = document.getElementById('visibleCount');

        if (totalCountEl) totalCountEl.textContent = totalCount;
        if (visibleCountEl) visibleCountEl.textContent = visibleCount;
    }

    /**
     * Select All Products Functionality
     */
    function initializeSelectAllFunctionality() {
        const selectAllCheckbox = document.getElementById('selectAllProducts');
        const productCheckboxes = document.querySelectorAll('.product-checkbox');

        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                const visibleCheckboxes = document.querySelectorAll('.product-checkbox:not(.product-row.hidden-by-search .product-checkbox):not(.product-row.hidden-by-filter .product-checkbox)');
                visibleCheckboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                });
                updateSelectedCount();
            });
        }

        // Individual checkbox change handler
        productCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateSelectAllState();
                updateSelectedCount();
            });
        });
    }

    /**
     * Update Select All checkbox state based on individual selections
     */
    function updateSelectAllState() {
        const selectAllCheckbox = document.getElementById('selectAllProducts');
        const productCheckboxes = document.querySelectorAll('.product-checkbox');
        const checkedBoxes = document.querySelectorAll('.product-checkbox:checked');

        if (selectAllCheckbox) {
            if (checkedBoxes.length === 0) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = false;
            } else if (checkedBoxes.length === productCheckboxes.length) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = true;
            } else {
                selectAllCheckbox.indeterminate = true;
            }
        }
    }

    /**
     * Update selected products count display
     */
    function updateSelectedCount() {
        const checkedBoxes = document.querySelectorAll('.product-checkbox:checked');
        const countDisplay = document.getElementById('selectedCount');

        if (countDisplay) {
            countDisplay.textContent = checkedBoxes.length;
        }
    }

    /**
     * Initialize margin calculation functionality
     */
    function initializeGroupMarginCalculations() {
        const marginInputs = document.querySelectorAll('.group-margin-input');
        const b2bPriceInputs = document.querySelectorAll('.b2b-price-input');

        // Margine → Prezzo B2B
        marginInputs.forEach(input => {
            input.addEventListener('input', function() {
                const productId = this.dataset.id;
                const groupId = this.dataset.group;
                const wholesalePrice = parseFloat(this.dataset.wholesale) || 0;
                const marginPercent = parseFloat(this.value) || 0;

                if (wholesalePrice > 0) {
                    const newB2BPrice = wholesalePrice * (1 + marginPercent / 100);
                    const b2bPriceInput = document.querySelector(`.b2b-price-input[data-id="${productId}"][data-group="${groupId}"]`);
                    if (b2bPriceInput) {
                        b2bPriceInput.value = newB2BPrice.toFixed(2);
                        markRowAsModified(productId);
                    }
                }
            });
        });

        // Prezzo B2B → Margine
        b2bPriceInputs.forEach(input => {
            input.addEventListener('input', function() {
                const productId = this.dataset.id;
                const groupId = this.dataset.group;
                const wholesalePrice = parseFloat(this.dataset.wholesale) || 0;
                const b2bPrice = parseFloat(this.value) || 0;

                if (wholesalePrice > 0 && b2bPrice > 0) {
                    const marginPercent = ((b2bPrice - wholesalePrice) / wholesalePrice) * 100;
                    const marginInput = document.querySelector(`.group-margin-input[data-id="${productId}"][data-group="${groupId}"]`);
                    if (marginInput) {
                        marginInput.value = marginPercent.toFixed(2);
                        markRowAsModified(productId);
                    }
                }
            });
        });
    }

    /**
     * Update row data attributes for filtering/sorting
     */
    function updateRowDataAttributes(productId, margin, b2bPrice) {
        const productRow = document.querySelector(`.product-row[data-id="${productId}"]`);
        if (productRow) {
            productRow.dataset.margin = margin.toFixed(2);
            productRow.dataset.b2bPrice = b2bPrice.toFixed(2);
        }
    }

    /**
     * Initialize global margin application
     */
    function initializeGlobalMarginApplication() {
        const globalMarginInput = document.getElementById('globalMargin');
        const globalB2BPriceInput = document.getElementById('globalB2BPrice');
        const applyButton = document.getElementById('applyGlobalMargin');

        if (applyButton) {
            applyButton.addEventListener('click', function () {
                const globalMargin = parseFloat(globalMarginInput.value);
                const globalB2BPrice = parseFloat(globalB2BPriceInput.value);

                if (isNaN(globalMargin) && isNaN(globalB2BPrice)) {
                    showAlert('Inserisci almeno un margine o un prezzo B2B globale.', 'warning');
                    return;
                }

                const selectedGroups = Array.from(document.querySelectorAll('.global-margin-group:checked')).map(el => el.value);
                if (selectedGroups.length === 0) {
                    showAlert('Seleziona almeno un gruppo o cliente.', 'warning');
                    return;
                }

                const selectedCheckboxes = document.querySelectorAll('.product-checkbox:checked');
                if (selectedCheckboxes.length === 0) {
                    showAlert('Seleziona almeno un prodotto.', 'warning');
                    return;
                }

                let appliedCount = 0;

                selectedCheckboxes.forEach(checkbox => {
                    const productId = checkbox.dataset.id;
                    const wholesale = parseFloat(document.querySelector(`.product-row[data-id="${productId}"]`).dataset.wholesalePrice);

                    selectedGroups.forEach(target => {
                        let [type, targetId] = target.includes('customer_') ? ['customer', target.replace('customer_', '')] : ['group', target];

                        const marginInput = document.querySelector(`.group-margin-input[data-id="${productId}"][data-group="${targetId}"]`);
                        const priceInput = document.querySelector(`.b2b-price-input[data-id="${productId}"][data-group="${targetId}"]`);

                        if (!priceInput || !marginInput) return;

                        if (!isNaN(globalB2BPrice)) {
                            // Imposta il prezzo B2B e calcola il margine
                            priceInput.value = globalB2BPrice.toFixed(2);

                            if (wholesale > 0) {
                                const margin = ((globalB2BPrice - wholesale) / wholesale) * 100;
                                marginInput.value = margin.toFixed(2);
                            }
                        } else if (!isNaN(globalMargin)) {
                            // Imposta il margine e calcola il prezzo B2B
                            marginInput.value = globalMargin.toFixed(2);

                            if (wholesale > 0) {
                                const price = wholesale * (1 + globalMargin / 100);
                                priceInput.value = price.toFixed(2);
                            }
                        }

                        marginInput.dispatchEvent(new Event('input'));
                        appliedCount++;
                    });
                });

                if (!isNaN(globalB2BPrice)) {
                    showAlert(`Prezzo B2B di €${globalB2BPrice.toFixed(2)} applicato a ${appliedCount} campi.`, 'success');
                } else {
                    showAlert(`Margine del ${globalMargin}% applicato a ${appliedCount} campi.`, 'success');
                }

                globalMarginInput.value = '';
                globalB2BPriceInput.value = '';
            });
        }
    }
    /**
     * Initialize toggle modified functionality
     */
    function initializeToggleModified() {
        const toggleButton = document.getElementById('toggleModified');
        let showingOnlyModified = false;

        if (toggleButton) {
            toggleButton.addEventListener('click', function() {
                const productRows = document.querySelectorAll('.product-row');

                if (!showingOnlyModified) {
                    // Show only modified rows
                    productRows.forEach(row => {
                        if (!row.classList.contains('modified')) {
                            row.style.display = 'none';
                        }
                    });
                    this.textContent = 'Mostra tutti';
                    this.classList.remove('btn-outline-secondary');
                    this.classList.add('btn-warning');
                    showingOnlyModified = true;
                } else {
                    // Show all rows
                    productRows.forEach(row => {
                        row.style.display = '';
                    });
                    this.innerHTML = '<i class="fas fa-eye me-2"></i>Mostra solo modificati';
                    this.classList.remove('btn-warning');
                    this.classList.add('btn-outline-secondary');
                    showingOnlyModified = false;
                }

                updateResultsInfo();
            });
        }
    }

    /**
     * Initialize reset specific price functionality
     */
    function initializeResetSpecificPrice() {
        const resetButtons = document.querySelectorAll('.reset-specific-price');

        resetButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.dataset.product;
                const groupId = this.dataset.group;  // <-- nuovo valore
                const isCustomer = this.dataset.type === 'customer'; // Aggiungi data-type="customer" nei pulsanti customer


                if (confirm('Sei sicuro di voler rimuovere il prezzo specifico per questo gruppo?')) {
                    const resetInputProduct = document.getElementById('resetSpecificPrice');
                    const resetInputGroup = document.getElementById('resetSpecificGroup');
                    document.getElementById('resetSelectionType').value = isCustomer ? 'customer' : 'group';

                    if (resetInputProduct) {
                        resetInputProduct.value = productId;
                    }

                    if (resetInputGroup) {
                        resetInputGroup.value = groupId;
                    }

                    // Submit form
                    document.getElementById('b2bForm').submit();
                }
            });
        });
    }


    /**
     * Initialize save all functionality
     */
    function initializeSaveAll() {
        const saveButton = document.getElementById('saveAll');

        if (saveButton) {
            saveButton.addEventListener('click', function() {
                const modifiedRows = document.querySelectorAll('.product-row.modified');

                if (modifiedRows.length === 0) {
                    showAlert('Non ci sono modifiche da salvare.', 'info');
                    return;
                }

                const selectionType = document.querySelector('input[name="selection_type"]').value;
                const targetType = selectionType === 'group' ? 'gruppo' : 'cliente';

                if (confirm(`Sei sicuro di voler salvare le modifiche per ${modifiedRows.length} prodotti del ${targetType} selezionato?`)) {
                    // Set save all flag
                    const saveAllHidden = document.getElementById('saveAllHidden');
                    if (saveAllHidden) {
                        saveAllHidden.value = '1';
                    }

                    // Add loading state
                    this.classList.add('loading');
                    this.disabled = true;

                    // Submit the form
                    document.getElementById('b2bForm').submit();
                }
            });
        }
    }

    /**
     * Initialize form validations
     */
    function initializeFormValidations() {
        const form = document.getElementById('b2bForm');

        if (form) {
            form.addEventListener('submit', function(e) {
                const requiredFields = form.querySelectorAll('[required]');
                let isValid = true;

                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        field.classList.add('is-invalid');
                        isValid = false;
                    } else {
                        field.classList.remove('is-invalid');
                    }
                });

                if (!isValid) {
                    e.preventDefault();
                    showAlert('Per favore compila tutti i campi obbligatori.', 'danger');
                }
            });
        }
    }

    /**
     * Initialize tooltips
     */
    function initializeTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[title]'));
        if (window.bootstrap) {
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }

    /**
     * Mark a product row as modified
     */
    function markRowAsModified(productId) {
        const productRow = document.querySelector(`.product-row[data-id="${productId}"]`);
        if (productRow) {
            productRow.classList.add('modified');
        }
    }

    /**
     * Show alert message
     */
    function showAlert(message, type = 'info') {
        // Remove any existing alerts
        const existingAlert = document.querySelector('.dynamic-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create new alert
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show dynamic-alert`;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.minWidth = '300px';

        alertDiv.innerHTML = `
            <i class="fas fa-${getIconForAlertType(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    /**
     * Get appropriate icon for alert type
     */
    function getIconForAlertType(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Initialize results info on load
    updateResultsInfo();
});

function initializeCategoryTreeCheckboxes() {
    const treeContainer = document.querySelector('.category-tree-container');
    if (!treeContainer) return;

    treeContainer.addEventListener('change', function (e) {
        const checkbox = e.target;
        if (checkbox.type !== 'checkbox') return;

        // Se checko un padre, checko tutte le figlie
        const parentLi = checkbox.closest('li');
        if (parentLi) {
            const childCheckboxes = parentLi.querySelectorAll('ul input[type="checkbox"]');
            childCheckboxes.forEach(child => {
                child.checked = checkbox.checked;
            });
        }

        // Se è una figlia, aggiorno lo stato del padre
        const parentUl = checkbox.closest('ul');
        if (parentUl) {
            const parentLi = parentUl.closest('li.tree-folder');
            if (parentLi) {
                const parentCheckbox = parentLi.querySelector('> span > input[type="checkbox"]');
                const siblingCheckboxes = parentUl.querySelectorAll('input[type="checkbox"]');
                const anyChecked = Array.from(siblingCheckboxes).some(cb => cb.checked);

                if (parentCheckbox) {
                    parentCheckbox.checked = anyChecked;
                }
            }
        }
    });
}
