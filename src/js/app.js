
        // Data storage
        let cheeseData = JSON.parse(localStorage.getItem('cheeseData')) || [];
        
        // DOM elements
        const cheeseForm = document.getElementById('cheeseForm');
        const lote1Input = document.getElementById('lote1');
        const lote2Input = document.getElementById('lote2');
        const fabricacaoInput = document.getElementById('fabricacao');
        const vencimentoInput = document.getElementById('vencimento');
        const pesoInput = document.getElementById('peso');
        const pesoTotalInput = document.getElementById('pesoTotal');
        const tipoCaixaSelect = document.getElementById('tipoCaixa');
        const formatoSelect = document.getElementById('formato');
        const saveBtn = document.getElementById('saveBtn');
        const clearBtn = document.getElementById('clearBtn');
        const deleteLastBtn = document.getElementById('deleteLastBtn');
        const deleteLoteBtn = document.getElementById('deleteLoteBtn');
        const cheeseTableBody = document.getElementById('cheeseTableBody');
        const deleteLoteModal = document.getElementById('deleteLoteModal');
        const loteToDeleteSelect = document.getElementById('loteToDelete');
        const additionalFilters = document.getElementById('additionalFilters');
        const filterTipoCaixa = document.getElementById('filterTipoCaixa');
        const filterFormato = document.getElementById('filterFormato');
        const filterFabricacao = document.getElementById('filterFabricacao');
        const cancelDeleteLoteBtn = document.getElementById('cancelDeleteLote');
        const confirmDeleteLoteBtn = document.getElementById('confirmDeleteLote');
        
        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            // Apply input masks
            applyInputMasks();
            
            // Load saved data
            updateTable();
            updatePesoTotal();
            
            // Set up event listeners
            setupEventListeners();
        });
        
        function applyInputMasks() {
            // Lote1 mask (111-1)
            lote1Input.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 3) {
                    value = value.substring(0, 3) + '-' + value.substring(3, 4);
                }
                e.target.value = value;
            });
            
            // Lote2 mask (111-1)
            lote2Input.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 3) {
                    value = value.substring(0, 3) + '-' + value.substring(3, 4);
                }
                e.target.value = value;
            });
            
            // Fabricação mask (DD/MM/AAAA)
            fabricacaoInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                
                // Apply mask as user types
                if (value.length > 2 && value.length <= 4) {
                    value = value.substring(0, 2) + '/' + value.substring(2);
                } else if (value.length > 4) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4) + '/' + value.substring(4, 8);
                }
                
                // Limit to 10 characters (DD/MM/YYYY)
                if (value.length > 10) {
                    value = value.substring(0, 10);
                }
                
                e.target.value = value;
                
                // Calculate expiration date (150 days after fabrication) only when date is complete
                if (value.length === 10) {
                    const [day, month, year] = value.split('/');
                    const fabricacaoDate = new Date(year, month - 1, day);
                    
                    // Validate date
                    if (isNaN(fabricacaoDate.getTime()) || 
                        day < 1 || day > 31 || 
                        month < 1 || month > 12 || 
                        year < 2000 || year > 2100) {
                        vencimentoInput.value = '';
                        return;
                    }
                    
                    const vencimentoDate = new Date(fabricacaoDate);
                    vencimentoDate.setDate(vencimentoDate.getDate() + 150);
                    
                    const vencimentoDay = String(vencimentoDate.getDate()).padStart(2, '0');
                    const vencimentoMonth = String(vencimentoDate.getMonth() + 1).padStart(2, '0');
                    const vencimentoYear = vencimentoDate.getFullYear();
                    
                    vencimentoInput.value = `${vencimentoDay}/${vencimentoMonth}/${vencimentoYear}`;
                } else {
                    vencimentoInput.value = '';
                }
            });
            
            // Peso mask (1,111)
            pesoInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/[^0-9,]/g, '');
                
                // Remove extra commas
                const commaCount = (value.match(/,/g) || []).length;
                if (commaCount > 1) {
                    value = value.replace(/,/g, '');
                    value = value.substring(0, 1) + ',' + value.substring(1);
                }
                
                // Ensure comma is in the correct position
                if (value.length > 1 && !value.includes(',')) {
                    value = value.substring(0, 1) + ',' + value.substring(1);
                }
                
                // Limit to 5 characters (1,111)
                if (value.length > 5) {
                    value = value.substring(0, 5);
                }
                
                e.target.value = value;
            });
        }
        
        function setupEventListeners() {
            // Enable/disable Lote2 based on Tipo de Caixa selection
            tipoCaixaSelect.addEventListener('change', function() {
                const isM2C = this.value === 'M2C';
                lote2Input.disabled = !isM2C;
                
                // Remove or add disabled classes based on selection
                if (isM2C) {
                    lote2Input.classList.remove('disabled-input');
                    lote2Input.classList.add('bg-white');
                } else {
                    lote2Input.classList.add('disabled-input');
                    lote2Input.classList.remove('bg-white');
                    lote2Input.value = '';
                }
            });
            
            // Calculate Peso Total when any relevant field changes
            [lote1Input, fabricacaoInput, tipoCaixaSelect, formatoSelect].forEach(input => {
                input.addEventListener('change', updatePesoTotal);
            });
            
            // Save button
            cheeseForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveCheese();
            });
            
            // Clear button
            clearBtn.addEventListener('click', clearForm);
            
            // Delete last button
            deleteLastBtn.addEventListener('click', deleteLastCheese);
            
            // Delete lote button
            deleteLoteBtn.addEventListener('click', showDeleteLoteModal);
            
            // Delete lote modal buttons
            cancelDeleteLoteBtn.addEventListener('click', hideDeleteLoteModal);
            confirmDeleteLoteBtn.addEventListener('click', deleteSelectedLote);
            
            // Additional filters change
            loteToDeleteSelect.addEventListener('change', updateAdditionalFilters);
            filterTipoCaixa.addEventListener('change', updateDeleteButtonState);
            filterFormato.addEventListener('change', updateDeleteButtonState);
            filterFabricacao.addEventListener('change', updateDeleteButtonState);
        }
        
        function saveCheese() {
            // Validate all required fields
            if (!cheeseForm.checkValidity()) {
                alert('Por favor, preencha todos os campos obrigatórios corretamente.');
                return;
            }
            
            // Validate date format
            const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (!dateRegex.test(fabricacaoInput.value)) {
                alert('Por favor, insira uma data de fabricação válida no formato DD/MM/AAAA.');
                return;
            }
            
            // Validate weight format
            const weightRegex = /^\d,\d{3}$/;
            if (!weightRegex.test(pesoInput.value)) {
                alert('Por favor, insira um peso válido no formato 1,111.');
                return;
            }
            
            // Create new cheese object with quantity = 1
            const cheese = {
                lote1: lote1Input.value,
                lote2: tipoCaixaSelect.value === 'M2C' ? lote2Input.value : '',
                fabricacao: fabricacaoInput.value,
                vencimento: vencimentoInput.value,
                peso: pesoInput.value,
                tipoCaixa: tipoCaixaSelect.value,
                formato: formatoSelect.value,
                quantidade: 1
            };
            
            // Add to data array
            cheeseData.push(cheese);
            
            // Save to localStorage
            localStorage.setItem('cheeseData', JSON.stringify(cheeseData));
            
            // Update UI
            updateTable();
            updatePesoTotal();
            
            // Clear only the weight field
            pesoInput.value = '';
        }
        
        function clearForm() {
            cheeseForm.reset();
            lote2Input.disabled = true;
            lote2Input.classList.add('disabled-input');
            lote2Input.classList.remove('bg-white');
            vencimentoInput.value = '';
            pesoTotalInput.value = '';
        }
        
        function deleteLastCheese() {
            if (cheeseData.length === 0) {
                alert('Não há caixas para deletar.');
                return;
            }
            
            if (confirm('Tem certeza que deseja deletar a última caixa salva?')) {
                // Remove only the last cheese (1 box)
                cheeseData.pop();
                localStorage.setItem('cheeseData', JSON.stringify(cheeseData));
                updateTable();
                updatePesoTotal();
            }
        }
        
        function showDeleteLoteModal() {
            if (cheeseData.length === 0) {
                alert('Não há lotes para deletar.');
                return;
            }
            
            // Get unique Lote1 values
            const uniqueLotes = [...new Set(cheeseData.map(c => c.lote1))];
            
            // Populate select
            loteToDeleteSelect.innerHTML = '<option value="" selected disabled>Selecione um Lote</option>';
            uniqueLotes.forEach(lote => {
                const option = document.createElement('option');
                option.value = lote;
                option.textContent = lote;
                loteToDeleteSelect.appendChild(option);
            });
            
            // Reset additional filters
            additionalFilters.classList.add('hidden');
            filterTipoCaixa.innerHTML = '<option value="">Todos os Tipos de Caixa</option>';
            filterFormato.innerHTML = '<option value="">Todos os Formatos</option>';
            filterFabricacao.innerHTML = '<option value="">Todas as Datas de Fabricação</option>';
            
            // Show modal
            deleteLoteModal.classList.remove('hidden');
        }
        
        function updateAdditionalFilters() {
            const selectedLote = loteToDeleteSelect.value;
            if (!selectedLote) {
                additionalFilters.classList.add('hidden');
                return;
            }
            
            // Get all cheeses with this lote
            const cheesesWithLote = cheeseData.filter(c => c.lote1 === selectedLote);
            
            // Check if we need additional filters (more than one unique combination)
            const uniqueCombinations = new Set();
            cheesesWithLote.forEach(c => {
                uniqueCombinations.add(`${c.tipoCaixa}|${c.formato}|${c.fabricacao}`);
            });
            
            if (uniqueCombinations.size <= 1) {
                additionalFilters.classList.add('hidden');
                return;
            }
            
            // We need additional filters
            additionalFilters.classList.remove('hidden');
            
            // Populate tipoCaixa filter
            const uniqueTipoCaixa = [...new Set(cheesesWithLote.map(c => c.tipoCaixa))];
            filterTipoCaixa.innerHTML = '<option value="">Todos os Tipos de Caixa</option>';
            uniqueTipoCaixa.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo;
                option.textContent = tipo;
                filterTipoCaixa.appendChild(option);
            });
            
            // Populate formato filter
            const uniqueFormato = [...new Set(cheesesWithLote.map(c => c.formato))];
            filterFormato.innerHTML = '<option value="">Todos os Formatos</option>';
            uniqueFormato.forEach(formato => {
                const option = document.createElement('option');
                option.value = formato;
                option.textContent = formato;
                filterFormato.appendChild(option);
            });
            
            // Populate fabricacao filter
            const uniqueFabricacao = [...new Set(cheesesWithLote.map(c => c.fabricacao))];
            filterFabricacao.innerHTML = '<option value="">Todas as Datas de Fabricação</option>';
            uniqueFabricacao.forEach(data => {
                const option = document.createElement('option');
                option.value = data;
                option.textContent = data;
                filterFabricacao.appendChild(option);
            });
        }
        
        function updateDeleteButtonState() {
            // Enable/disable delete button based on filter selections
            const hasFilters = filterTipoCaixa.value || filterFormato.value || filterFabricacao.value;
            confirmDeleteLoteBtn.disabled = !hasFilters;
        }
        
        function hideDeleteLoteModal() {
            deleteLoteModal.classList.add('hidden');
        }
        
        function deleteSelectedLote() {
            const selectedLote = loteToDeleteSelect.value;
            if (!selectedLote) {
                alert('Por favor, selecione um lote para deletar.');
                return;
            }
            
            // Get filter values
            const tipoCaixaFilter = filterTipoCaixa.value;
            const formatoFilter = filterFormato.value;
            const fabricacaoFilter = filterFabricacao.value;
            
            // Check if we're using additional filters
            const usingFilters = tipoCaixaFilter || formatoFilter || fabricacaoFilter;
            
            let confirmationMessage;
            let cheesesToDelete;
            
            if (usingFilters) {
                // Delete with additional filters
                cheesesToDelete = cheeseData.filter(c => 
                    c.lote1 === selectedLote &&
                    (tipoCaixaFilter ? c.tipoCaixa === tipoCaixaFilter : true) &&
                    (formatoFilter ? c.formato === formatoFilter : true) &&
                    (fabricacaoFilter ? c.fabricacao === fabricacaoFilter : true)
                );
                
                confirmationMessage = `Tem certeza que deseja deletar ${cheesesToDelete.length} caixa(s) do lote ${selectedLote}`;
                
                if (tipoCaixaFilter) confirmationMessage += `, Tipo: ${tipoCaixaFilter}`;
                if (formatoFilter) confirmationMessage += `, Formato: ${formatoFilter}`;
                if (fabricacaoFilter) confirmationMessage += `, Fabricação: ${fabricacaoFilter}`;
                
                confirmationMessage += '?';
            } else {
                // Delete all with this lote
                cheesesToDelete = cheeseData.filter(c => c.lote1 === selectedLote);
                confirmationMessage = `Tem certeza que deseja deletar todas as ${cheesesToDelete.length} caixas do lote ${selectedLote}?`;
            }
            
            if (confirm(confirmationMessage)) {
                // Remove the cheeses from the array
                cheeseData = cheeseData.filter(c => !cheesesToDelete.includes(c));
                
                // Save to localStorage
                localStorage.setItem('cheeseData', JSON.stringify(cheeseData));
                
                // Update UI
                updateTable();
                updatePesoTotal();
                hideDeleteLoteModal();
            }
        }
        
        function updatePesoTotal() {
            if (!lote1Input.value || !fabricacaoInput.value || !tipoCaixaSelect.value || !formatoSelect.value) {
                pesoTotalInput.value = '';
                return;
            }
            
            // Filter cheeses with same lote1, fabricacao, tipoCaixa and formato
            const filteredCheeses = cheeseData.filter(c => 
                c.lote1 === lote1Input.value && 
                c.fabricacao === fabricacaoInput.value && 
                c.tipoCaixa === tipoCaixaSelect.value && 
                c.formato === formatoSelect.value
            );
            
            if (filteredCheeses.length === 0) {
                pesoTotalInput.value = '';
                return;
            }
            
            // Calculate total quantity
            const totalQuantity = filteredCheeses.length;
            
            // Get the latest cheese (which has the most recent weight)
            const latestCheese = filteredCheeses[filteredCheeses.length - 1];
            
            // Calculate total weight (latest weight * quantity)
            const weight = parseFloat(latestCheese.peso.replace(',', '.'));
            const total = weight * totalQuantity;
            
            // Update input
            pesoTotalInput.value = total.toFixed(3).replace('.', ',');
        }
        
        function updateTable() {
            cheeseTableBody.innerHTML = '';
            
            if (cheeseData.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="9" class="px-6 py-4 text-center text-sm text-gray-500">
                        Nenhuma caixa de queijo cadastrada ainda.
                    </td>
                `;
                cheeseTableBody.appendChild(row);
                return;
            }
            
            // Group cheeses by lote1, lote2, fabricacao, tipoCaixa and formato
            const groupedCheeses = {};
            
            cheeseData.forEach(cheese => {
                const key = `${cheese.lote1}|${cheese.lote2}|${cheese.fabricacao}|${cheese.tipoCaixa}|${cheese.formato}`;
                
                if (!groupedCheeses[key]) {
                    groupedCheeses[key] = {
                        lote1: cheese.lote1,
                        lote2: cheese.lote2,
                        fabricacao: cheese.fabricacao,
                        vencimento: cheese.vencimento,
                        tipoCaixa: cheese.tipoCaixa,
                        formato: cheese.formato,
                        quantidade: 0,
                        peso: cheese.peso // Will be updated to the latest weight
                    };
                }
                
                // Sum quantities and keep the latest weight
                groupedCheeses[key].quantidade += 1;
                groupedCheeses[key].peso = cheese.peso;
            });
            
            // Display grouped cheeses
            Object.values(groupedCheeses).forEach(cheese => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cheese.lote1}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cheese.lote2 || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cheese.fabricacao}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cheese.vencimento}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cheese.peso}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cheese.quantidade}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(parseFloat(cheese.peso.replace(',', '.')) * cheese.quantidade).toFixed(3).replace('.', ',')}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cheese.tipoCaixa}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${cheese.formato}</td>
                `;
                cheeseTableBody.appendChild(row);
            });
        }