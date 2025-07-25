class UNMSMCalculator {
    constructor() {
        // Prevenir múltiples inicializaciones
        if (window.calculatorInstance) {
            console.warn('⚠️ UNMSMCalculator ya fue inicializado');
            return window.calculatorInstance;
        }
        
        this.courses = [];
        this.periods = [];
        this.initializeEventListeners();
        
        // Marcar como inicializado
        window.calculatorInstance = this;
        console.log('✅ UNMSMCalculator inicializado correctamente');
    }

    initializeEventListeners() {
        // Upload zone events
        const uploadZone = document.getElementById('upload-zone');
        const pdfInput = document.getElementById('pdf-input');

        uploadZone.addEventListener('click', () => pdfInput.click());
        uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadZone.addEventListener('drop', this.handleDrop.bind(this));

        pdfInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Calculate button
        document.getElementById('calculate-btn').addEventListener('click', this.calculateAverage.bind(this));
        
        // Reset button
        document.getElementById('reset-btn').addEventListener('click', this.reset.bind(this));

        // Period selector
        document.getElementById('period-select').addEventListener('change', this.onPeriodChange.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            this.processFile(files[0]);
        } else {
            this.showMessage('Por favor, selecciona un archivo PDF válido', 'error');
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('📄 Archivo seleccionado:', file.name);
            this.processFile(file);
            // Resetear el input para permitir seleccionar el mismo archivo nuevamente si es necesario
            e.target.value = '';
        }
    }

    async processFile(file) {
        // Prevenir procesamiento múltiple del mismo archivo
        if (this.isProcessing) {
            console.warn('⚠️ Ya se está procesando un archivo, ignorando...');
            return;
        }
        
        this.isProcessing = true;
        
        try {
            console.log('📤 Procesando archivo:', file.name, 'Tamaño:', file.size);
            
            this.showLoading(true);
            this.showMessage('Analizando PDF con IA...', 'info');

            const formData = new FormData();
            formData.append('pdfFile', file);

            console.log('🌐 Enviando archivo al servidor...');
            const response = await fetch('/upload-pdf', {
                method: 'POST',
                body: formData
            });

            console.log('Respuesta del servidor:', response.status, response.statusText);
            
            // Verificar si la respuesta es OK antes de intentar parsear JSON
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error del servidor (texto):', errorText);
                throw new Error(`Error del servidor (${response.status}): ${errorText}`);
            }

            // Intentar parsear JSON con manejo de errores
            let result;
            try {
                const responseText = await response.text();
                console.log('Respuesta como texto:', responseText);
                result = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('Error parsing JSON:', jsonError);
                console.error('Respuesta del servidor no es JSON válido');
                throw new Error('La respuesta del servidor no es válida. Verifica que el servidor esté funcionando correctamente.');
            }

            console.log('Resultado parseado:', result);

            if (result.success) {
                this.courses = result.courses;
                this.periods = result.periods;
                this.calculation = result.calculation;
                this.showCoursesExtracted(result.courses.length);
                this.populatePeriodSelector();
                this.showStep('period-section');
                this.showMessage(result.message, 'success');
                
                console.log('Cursos extraídos:', result.courses);
                console.log('Períodos encontrados:', result.periods);
            } else {
                console.error('Error del servidor:', result.error);
                if (result.debug) {
                    console.log('Debug info:', result.debug);
                }
                
                let errorMessage = result.error;
                if (result.debug && result.debug.textSample) {
                    errorMessage += '\n\nMuestra del texto extraído: ' + result.debug.textSample;
                }
                
                this.showMessage(errorMessage, 'error');
                this.showDebugInfo(result.debug);
            }
        } catch (error) {
            console.error('Error completo:', error);
            this.showMessage('Error procesando archivo: ' + error.message, 'error');
            
            // Mostrar información adicional de debug
            this.showTechnicalError(error);
        } finally {
            this.showLoading(false);
            this.isProcessing = false; // Resetear flag de procesamiento
        }
    }

    populatePeriodSelector() {
        const select = document.getElementById('period-select');
        select.innerHTML = '<option value="">📊 Todos los períodos disponibles</option>';
        
        this.periods.forEach(period => {
            const option = document.createElement('option');
            option.value = period;
            option.textContent = `📅 ${period}`;
            select.appendChild(option);
        });
        
        // Mostrar información sobre los períodos encontrados
        this.showPeriodInfo();
        
        document.getElementById('calculate-btn').style.display = 'inline-flex';
    }

    showPeriodInfo() {
        const previewDiv = document.getElementById('period-preview');
        const periodsListDiv = document.getElementById('periods-list');
        
        if (this.periods.length > 0) {
            previewDiv.style.display = 'block';
            
            periodsListDiv.innerHTML = this.periods.map(period => 
                `<span class="period-chip">${period}</span>`
            ).join('');
        }
    }

    onPeriodChange() {
        const selectedPeriod = document.getElementById('period-select').value;
        
        // Actualizar vista previa de períodos
        this.updatePeriodPreview(selectedPeriod);
        
        // Auto-calculate when period changes
        if (this.courses.length > 0) {
            this.calculateAverage();
        }
    }

    updatePeriodPreview(selectedPeriod) {
        const periodsListDiv = document.getElementById('periods-list');
        
        if (this.periods.length > 0) {
            periodsListDiv.innerHTML = this.periods.map(period => {
                const isIncluded = !selectedPeriod || period <= selectedPeriod;
                const chipClass = isIncluded ? 'period-chip' : 'period-chip excluded';
                const icon = isIncluded ? '✅' : '❌';
                return `<span class="${chipClass}">${icon} ${period}</span>`;
            }).join('');
        }
    }

    async calculateAverage() {
        try {
            const selectedPeriod = document.getElementById('period-select').value;
            
            // Filtrar cursos excluidos del cálculo
            const coursesForCalculation = this.courses.filter(course => !course.excludeFromCalculation);
            
            const response = await fetch('/calculate-average', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    courses: coursesForCalculation, // Solo enviar cursos no excluidos
                    selectedPeriod: selectedPeriod
                })
            });

            const result = await response.json();

            if (result.success) {
                this.displayResults(result.result);
                this.showStep('results-section');
                this.showStep('courses-section');
                document.getElementById('reset-btn').style.display = 'inline-flex';
                this.showMessage('¡Promedio calculado exitosamente!', 'success');
            } else {
                this.showMessage(result.error, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showMessage('Error calculando el promedio: ' + error.message, 'error');
        }
    }

    displayResults(result) {
        // Update summary values
        document.getElementById('average-value').textContent = result.weightedAverage.toFixed(3);
        document.getElementById('total-credits').textContent = result.totalCredits;
        document.getElementById('approved-credits').textContent = result.approvedCredits;
        document.getElementById('total-courses').textContent = result.courses.length;

        // Color code the average
        const averageElement = document.getElementById('average-value');
        const average = result.weightedAverage;
        
        if (average >= 16) {
            averageElement.style.color = '#27ae60'; // Green
        } else if (average >= 14) {
            averageElement.style.color = '#f39c12'; // Orange
        } else if (average >= 11) {
            averageElement.style.color = '#e67e22'; // Dark orange
        } else {
            averageElement.style.color = '#e74c3c'; // Red
        }

        // Update courses table
        this.updateCoursesTable(result.courses);
    }

    updateCoursesTable(courses) {
        const tbody = document.getElementById('courses-tbody');
        tbody.innerHTML = '';

        courses.forEach((course, index) => {
            const row = document.createElement('tr');
            const points = (course.note * course.credits).toFixed(1);
            
            // Color code the grade
            let gradeClass = '';
            if (course.note >= 16) gradeClass = 'grade-excellent';
            else if (course.note >= 14) gradeClass = 'grade-good';
            else if (course.note >= 11) gradeClass = 'grade-pass';
            else gradeClass = 'grade-fail';

            // Usar el código del curso como identificador único en lugar del índice
            const courseId = course.code;

            row.innerHTML = `
                <td>${course.period || 'N/A'}</td>
                <td class="course-code-cell"><strong>${course.code}</strong></td>
                <td class="course-name-cell">${course.name}</td>
                <td class="${gradeClass}">
                    <div class="grade-container">
                        <span class="grade-display" id="grade-${courseId}">${course.note}</span>
                        <input type="number" class="grade-input" id="input-${courseId}" 
                               value="${course.note}" min="0" max="20" step="1" style="display: none;">
                        <button class="edit-grade-btn" onclick="window.calculator.editGradeByCode('${courseId}')" 
                                title="Editar nota">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
                <td>${course.credits}</td>
                <td class="points-cell" id="points-${courseId}">${points}</td>
                <td class="actions-cell">
                    <button class="delete-course-btn" onclick="window.calculator.toggleCourseFromCalculation('${courseId}')" 
                            title="Eliminar/Restaurar curso del cálculo" id="delete-btn-${courseId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add CSS classes for grade colors
        this.addGradeStyles();
    }

    addGradeStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .grade-excellent { color: #27ae60; font-weight: bold; }
            .grade-good { color: #f39c12; font-weight: bold; }
            .grade-pass { color: #e67e22; font-weight: bold; }
            .grade-fail { color: #e74c3c; font-weight: bold; }
            .course-code-cell { 
                font-family: 'Courier New', monospace;
                font-size: 14px;
                font-weight: bold;
                color: #34495e;
                width: 120px;
                text-align: center;
            }
            .course-name-cell { 
                max-width: 350px; 
                word-wrap: break-word; 
                line-height: 1.4;
                font-size: 14px; 
                color: #2c3e50; 
            }
            .grade-container {
                display: flex;
                align-items: center;
                gap: 8px;
                justify-content: center;
            }
            .edit-grade-btn {
                background: none;
                border: none;
                color: #3498db;
                cursor: pointer;
                padding: 4px;
                border-radius: 3px;
                font-size: 12px;
                opacity: 0.7;
                transition: all 0.3s ease;
            }
            .edit-grade-btn:hover {
                opacity: 1;
                background: #ecf0f1;
            }
            .grade-input {
                width: 50px;
                padding: 4px;
                border: 2px solid #3498db;
                border-radius: 4px;
                text-align: center;
                font-weight: bold;
            }
            .grade-display {
                font-weight: bold;
                min-width: 25px;
                text-align: center;
            }
            .editing {
                background-color: #ebf3fd !important;
            }
        `;
        if (!document.querySelector('style[data-grades]')) {
            style.setAttribute('data-grades', 'true');
            document.head.appendChild(style);
        }
    }

    editGradeByCode(courseCode) {
        // Buscar el curso por código en lugar de usar índice
        const courseIndex = this.courses.findIndex(course => course.code === courseCode);
        
        if (courseIndex === -1) {
            this.showMessage('Error: Curso no encontrado', 'error');
            return;
        }

        const course = this.courses[courseIndex];
        const gradeDisplay = document.getElementById(`grade-${courseCode}`);
        const gradeInput = document.getElementById(`input-${courseCode}`);
        const row = gradeDisplay.closest('tr');
        
        if (gradeInput.style.display === 'none') {
            // Almacenar la nota original para comparación
            const originalGrade = course.note;
            
            // Entrar en modo edición
            gradeDisplay.style.display = 'none';
            gradeInput.style.display = 'inline-block';
            gradeInput.focus();
            gradeInput.select();
            row.classList.add('editing');
            
            // Agregar event listeners para guardar
            const saveGrade = () => {
                const newGrade = parseInt(gradeInput.value);
                if (newGrade >= 0 && newGrade <= 20) {
                    // Solo actualizar si la nota realmente cambió
                    if (newGrade !== originalGrade) {
                        console.log(`📝 Actualizando nota: ${courseCode} de ${originalGrade} a ${newGrade}`);
                        
                        // Actualizar en el array de cursos
                        this.courses[courseIndex].note = newGrade;
                        this.courses[courseIndex].isApproved = newGrade >= 11;
                        this.courses[courseIndex].editedByUser = true;
                        
                        // Actualizar interfaz
                        gradeDisplay.textContent = newGrade;
                        gradeDisplay.style.display = 'inline-block';
                        gradeInput.style.display = 'none';
                        row.classList.remove('editing');
                        
                        // Actualizar color de la nota
                        const gradeCell = gradeDisplay.closest('td');
                        gradeCell.className = '';
                        if (newGrade >= 16) gradeCell.classList.add('grade-excellent');
                        else if (newGrade >= 14) gradeCell.classList.add('grade-good');
                        else if (newGrade >= 11) gradeCell.classList.add('grade-pass');
                        else gradeCell.classList.add('grade-fail');
                        
                        // Actualizar puntos
                        const newPoints = (newGrade * course.credits).toFixed(1);
                        document.getElementById(`points-${courseCode}`).textContent = newPoints;
                        
                        // Recalcular promedio SIN regenerar la tabla
                        this.calculateAverageOnly();
                        
                        // Mensaje de confirmación con información correcta
                        this.showMessage(`✅ Nota actualizada: ${courseCode} - ${course.name.substring(0, 30)}... (${originalGrade} → ${newGrade})`, 'success');
                    } else {
                        // No hubo cambio, solo salir del modo edición
                        gradeDisplay.style.display = 'inline-block';
                        gradeInput.style.display = 'none';
                        row.classList.remove('editing');
                    }
                } else {
                    this.showMessage('❌ La nota debe estar entre 0 y 20', 'error');
                    gradeInput.focus();
                }
            };
            
            const cancelEdit = () => {
                gradeDisplay.style.display = 'inline-block';
                gradeInput.style.display = 'none';
                row.classList.remove('editing');
                gradeInput.value = originalGrade; // Restaurar valor original
            };
            
            // Guardar con Enter
            gradeInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveGrade();
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEdit();
                }
            });
            
            // Guardar al perder foco
            gradeInput.addEventListener('blur', saveGrade);
        }
    }

    // Método para eliminar/restaurar curso del cálculo
    toggleCourseFromCalculation(courseCode) {
        // Buscar el curso por código
        const courseIndex = this.courses.findIndex(course => course.code === courseCode);
        
        if (courseIndex === -1) {
            this.showMessage('Error: Curso no encontrado', 'error');
            return;
        }

        const course = this.courses[courseIndex];
        const row = document.querySelector(`#delete-btn-${courseCode}`).closest('tr');
        const deleteBtn = document.getElementById(`delete-btn-${courseCode}`);
        
        // Alternar estado de eliminación
        course.excludeFromCalculation = !course.excludeFromCalculation;
        
        if (course.excludeFromCalculation) {
            // Curso eliminado del cálculo
            row.classList.add('course-deleted');
            deleteBtn.innerHTML = '<i class="fas fa-undo"></i>';
            deleteBtn.title = 'Restaurar curso al cálculo';
            deleteBtn.style.background = '#27ae60';
            
            // Mostrar mensaje de confirmación
            let courseName = course.name.length > 30 ? course.name.substring(0, 30) + '...' : course.name;
            this.showMessage(`🗑️ Curso "${courseName}" eliminado del cálculo`, 'warning');
        } else {
            // Curso restaurado al cálculo
            row.classList.remove('course-deleted');
            row.classList.add('course-restored');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Eliminar curso del cálculo';
            deleteBtn.style.background = '#e74c3c';
            
            // Remover clase de animación después de un tiempo
            setTimeout(() => {
                row.classList.remove('course-restored');
            }, 300);
            
            // Mostrar mensaje de confirmación
            let courseName = course.name.length > 30 ? course.name.substring(0, 30) + '...' : course.name;
            this.showMessage(`✅ Curso "${courseName}" restaurado al cálculo`, 'success');
        }
        
        // Recalcular automáticamente el promedio
        this.calculateAverageOnly();
        
        console.log(`🔄 Curso ${courseCode} ${course.excludeFromCalculation ? 'eliminado' : 'restaurado'} del cálculo`);
    }

    // Mantener la función anterior para compatibilidad, pero marcarla como deprecated
    editGrade(courseIndex) {
        console.warn('editGrade(index) está deprecated, usar editGradeByCode(code)');
        if (courseIndex < this.courses.length) {
            const courseCode = this.courses[courseIndex].code;
            this.editGradeByCode(courseCode);
        }
    }

    updateCourseGrade(courseIndex, newGrade) {
        // Función simplificada - usar editGradeByCode para nuevas implementaciones
        if (courseIndex < this.courses.length) {
            this.courses[courseIndex].note = newGrade;
            this.courses[courseIndex].isApproved = newGrade >= 11;
            this.courses[courseIndex].editedByUser = true;
            
            console.log(`📝 Nota actualizada: ${this.courses[courseIndex].code} - Nota: ${newGrade}`);
        }
    }

    // Nueva función que solo recalcula los valores sin regenerar la tabla
    async calculateAverageOnly() {
        try {
            console.log('🔄 Recalculando promedio con datos actualizados...');
            
            const selectedPeriod = document.getElementById('period-select').value;
            
            // Filtrar cursos excluidos del cálculo
            const coursesForCalculation = this.courses.filter(course => !course.excludeFromCalculation);
            const excludedCourses = this.courses.filter(course => course.excludeFromCalculation);
            
            console.log(`📊 Cursos incluidos en el cálculo: ${coursesForCalculation.length}`);
            if (excludedCourses.length > 0) {
                console.log(`🗑️ Cursos excluidos del cálculo: ${excludedCourses.length}`);
                excludedCourses.forEach(course => {
                    console.log(`   - ${course.code}: ${course.name.substring(0, 30)}...`);
                });
            }
            
            // Mostrar información de cursos editados para verificación
            const editedCourses = coursesForCalculation.filter(course => course.editedByUser);
            if (editedCourses.length > 0) {
                console.log('📝 Cursos editados por el usuario:');
                editedCourses.forEach(course => {
                    console.log(`   ${course.code}: ${course.note} (${course.note >= 11 ? 'Aprobado' : 'Desaprobado'})`);
                });
            }
            
            const response = await fetch('/calculate-average', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    courses: coursesForCalculation, // Solo enviar cursos no excluidos
                    selectedPeriod: selectedPeriod
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Promedio recalculado:', result.result.weightedAverage.toFixed(3));
                // Solo actualizar los valores numéricos, NO regenerar la tabla
                this.updateSummaryOnly(result.result);
            } else {
                this.showMessage(result.error, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showMessage('Error recalculando el promedio: ' + error.message, 'error');
        }
    }

    // Nueva función que solo actualiza los valores del resumen
    updateSummaryOnly(result) {
        console.log('📊 Actualizando resumen con nuevos valores:', {
            promedio: result.weightedAverage.toFixed(3),
            totalCreditos: result.totalCredits,
            creditosAprobados: result.approvedCredits,
            totalCursos: result.courses.length
        });

        // Update summary values
        document.getElementById('average-value').textContent = result.weightedAverage.toFixed(3);
        document.getElementById('total-credits').textContent = result.totalCredits;
        document.getElementById('approved-credits').textContent = result.approvedCredits;
        document.getElementById('total-courses').textContent = result.courses.length;

        // Color code the average
        const averageElement = document.getElementById('average-value');
        const average = result.weightedAverage;
        
        if (average >= 16) {
            averageElement.style.color = '#27ae60'; // Green
        } else if (average >= 14) {
            averageElement.style.color = '#f39c12'; // Orange
        } else if (average >= 11) {
            averageElement.style.color = '#e67e22'; // Dark orange
        } else {
            averageElement.style.color = '#e74c3c'; // Red
        }
        
        console.log('✅ Resumen actualizado en la interfaz');
    }

    showCoursesExtracted(count) {
        const uploadContent = document.querySelector('.upload-content');
        uploadContent.innerHTML = `
            <i class="fas fa-check-circle" style="color: #27ae60;"></i>
            <p><strong>¡PDF procesado exitosamente!</strong></p>
            <small>Se extrajeron ${count} cursos</small>
        `;
    }

    showStep(stepId) {
        document.getElementById(stepId).style.display = 'block';
        
        // Smooth scroll to the step
        setTimeout(() => {
            document.getElementById(stepId).scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }

    showTechnicalError(error) {
        const uploadZone = document.getElementById('upload-zone');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'technical-error';
        errorDiv.innerHTML = `
            <h4><i class="fas fa-exclamation-triangle"></i> Error Técnico:</h4>
            <p><strong>Mensaje:</strong> ${error.message}</p>
            <details>
                <summary>Información técnica (para desarrolladores)</summary>
                <pre>${error.stack || 'No stack trace disponible'}</pre>
            </details>
            <div class="error-suggestions">
                <h5>Posibles soluciones:</h5>
                <ul>
                    <li>Verifica que el servidor esté funcionando en http://localhost:3001</li>
                    <li>Asegúrate de que el archivo PDF sea válido y no esté corrupto</li>
                    <li>Prueba con un archivo PDF más pequeño</li>
                    <li>Revisa la consola del navegador (F12) para más detalles</li>
                </ul>
            </div>
        `;
        errorDiv.style.cssText = `
            margin-top: 20px;
            padding: 20px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-left: 4px solid #e17055;
            border-radius: 8px;
            font-size: 0.9em;
        `;
        
        uploadZone.appendChild(errorDiv);
    }

    showDebugInfo(debug) {
        if (!debug) return;
        
        console.log('=== DEBUG INFO ===');
        console.log('Longitud del texto:', debug.textLength);
        console.log('Períodos encontrados:', debug.periodsFound);
        console.log('Muestra del texto:', debug.textSample);
        
        // Crear elemento de debug en la UI
        const uploadZone = document.getElementById('upload-zone');
        const debugDiv = document.createElement('div');
        debugDiv.className = 'debug-info';
        debugDiv.innerHTML = `
            <h4>Información de Debug:</h4>
            <p><strong>Texto extraído:</strong> ${debug.textLength} caracteres</p>
            <p><strong>Períodos encontrados:</strong> ${debug.periodsFound || 0}</p>
            ${debug.textSample ? `<p><strong>Muestra:</strong><br><code>${debug.textSample}</code></p>` : ''}
            <small>Revisa la consola del navegador (F12) para más detalles</small>
        `;
        debugDiv.style.cssText = `
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            font-size: 0.9em;
        `;
        
        uploadZone.appendChild(debugDiv);
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('message-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${this.getMessageIcon(type)}"></i>
            ${message}
        `;
        
        container.appendChild(messageDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);

        // Remove on click
        messageDiv.addEventListener('click', () => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        });
    }

    getMessageIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'info': return 'info-circle';
            default: return 'info-circle';
        }
    }

    reset() {
        // Reset data
        this.courses = [];
        this.periods = [];
        
        // Reset UI
        document.getElementById('pdf-input').value = '';
        document.getElementById('period-select').innerHTML = '<option value="">Todos los períodos</option>';
        
        // Hide sections
        document.getElementById('period-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('courses-section').style.display = 'none';
        document.getElementById('calculate-btn').style.display = 'none';
        document.getElementById('reset-btn').style.display = 'none';
        
        // Reset upload zone
        const uploadContent = document.querySelector('.upload-content');
        uploadContent.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Arrastra tu PDF aquí o haz clic para seleccionar</p>
            <small>Solo archivos PDF (máx. 10MB)</small>
        `;
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        this.showMessage('Listo para un nuevo cálculo', 'info');
    }
}

// Initialize the calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar una vez y hacer la instancia global
    window.calculator = new UNMSMCalculator();
    
    // Add some nice animations
    const sections = document.querySelectorAll('.step-section');
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, index * 200);
    });
});
