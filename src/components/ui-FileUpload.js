/**
 * Enterprise FileUpload with drag-and-drop, preview, progress, validation
 */
export function FileUpload({
  label = '',
  required = false,
  disabled = false,
  multiple = false,
  accept = '*',
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  helperText = '',
  errorText = '',
  preview = true,
  uploadUrl = null,
  onChange = null,
  onUpload = null
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'enterprise-upload-wrapper';
  wrapper.style.marginBottom = '16px';
  
  const container = document.createElement('div');
  container.className = 'enterprise-upload';
  
  // Label
  const labelEl = document.createElement('label');
  labelEl.className = 'enterprise-upload__label';
  labelEl.textContent = label + (required ? ' *' : '');
  
  // Drop zone
  const dropzone = document.createElement('div');
  dropzone.className = 'enterprise-upload__dropzone';
  dropzone.innerHTML = `
    <span class="material-icons enterprise-upload__icon">cloud_upload</span>
    <div class="enterprise-upload__text">
      <strong>Drop files here</strong> or click to browse
    </div>
    <div class="enterprise-upload__hint">
      ${accept !== '*' ? `Accepted: ${accept}` : 'All files accepted'} • Max size: ${formatBytes(maxSize)}
    </div>
  `;
  
  // Hidden file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = accept;
  fileInput.multiple = multiple;
  fileInput.style.display = 'none';
  if (disabled) fileInput.disabled = true;
  
  // Files list
  const filesList = document.createElement('div');
  filesList.className = 'enterprise-upload__files';
  
  // Helper text
  const helper = document.createElement('div');
  helper.className = 'enterprise-upload__helper';
  helper.textContent = helperText || errorText;
  if (errorText) helper.classList.add('enterprise-upload__helper--error');
  
  container.append(labelEl, dropzone, fileInput, filesList, helper);
  wrapper.appendChild(container);
  
  // State
  let files = [];
  let uploading = false;
  
  // Format bytes
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  // Validate file
  function validateFile(file) {
    if (file.size > maxSize) {
      return `File ${file.name} exceeds max size of ${formatBytes(maxSize)}`;
    }
    
    if (accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      const fileType = file.type;
      
      const isValid = acceptedTypes.some(type => {
        if (type.startsWith('.')) return type === fileExt;
        if (type.endsWith('/*')) return fileType.startsWith(type.replace('/*', ''));
        return type === fileType;
      });
      
      if (!isValid) {
        return `File ${file.name} type not accepted`;
      }
    }
    
    return null;
  }
  
  // Add files
  function addFiles(newFiles) {
    const fileArray = Array.from(newFiles);
    
    if (!multiple && fileArray.length > 1) {
      showError('Only one file allowed');
      return;
    }
    
    if (files.length + fileArray.length > maxFiles) {
      showError(`Maximum ${maxFiles} files allowed`);
      return;
    }
    
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        showError(error);
        return;
      }
      
      const fileObj = {
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        uploaded: false,
        error: null,
        url: null
      };
      
      files.push(fileObj);
      renderFile(fileObj);
      
      if (preview && file.type.startsWith('image/')) {
        loadPreview(fileObj);
      }
      
      if (uploadUrl || onUpload) {
        uploadFile(fileObj);
      }
    });
    
    onChange?.(files);
  }
  
  // Load preview
  function loadPreview(fileObj) {
    const reader = new FileReader();
    reader.onload = (e) => {
      fileObj.preview = e.target.result;
      updateFileElement(fileObj);
    };
    reader.readAsDataURL(fileObj.file);
  }
  
  // Render file
  function renderFile(fileObj) {
    const fileEl = document.createElement('div');
    fileEl.className = 'enterprise-upload__file';
    fileEl.dataset.id = fileObj.id;
    
    fileEl.innerHTML = `
      <div class="enterprise-upload__file-preview">
        ${fileObj.preview 
          ? `<img src="${fileObj.preview}" alt="${fileObj.name}">` 
          : `<span class="material-icons">insert_drive_file</span>`
        }
      </div>
      <div class="enterprise-upload__file-info">
        <div class="enterprise-upload__file-name">${fileObj.name}</div>
        <div class="enterprise-upload__file-size">${formatBytes(fileObj.size)}</div>
        ${fileObj.progress > 0 && fileObj.progress < 100 
          ? `<div class="enterprise-upload__file-progress">
              <div class="enterprise-upload__file-progress-bar" style="width: ${fileObj.progress}%"></div>
            </div>`
          : ''
        }
        ${fileObj.error 
          ? `<div class="enterprise-upload__file-error">${fileObj.error}</div>`
          : ''
        }
      </div>
      <button type="button" class="enterprise-upload__file-remove" data-id="${fileObj.id}">
        <span class="material-icons">close</span>
      </button>
    `;
    
    filesList.appendChild(fileEl);
  }
  
  // Update file element
  function updateFileElement(fileObj) {
    const fileEl = filesList.querySelector(`[data-id="${fileObj.id}"]`);
    if (!fileEl) return;
    
    const preview = fileEl.querySelector('.enterprise-upload__file-preview');
    if (fileObj.preview && preview) {
      preview.innerHTML = `<img src="${fileObj.preview}" alt="${fileObj.name}">`;
    }
    
    const info = fileEl.querySelector('.enterprise-upload__file-info');
    info.innerHTML = `
      <div class="enterprise-upload__file-name">${fileObj.name}</div>
      <div class="enterprise-upload__file-size">${formatBytes(fileObj.size)}</div>
      ${fileObj.progress > 0 && fileObj.progress < 100 
        ? `<div class="enterprise-upload__file-progress">
            <div class="enterprise-upload__file-progress-bar" style="width: ${fileObj.progress}%"></div>
          </div>`
        : ''
      }
      ${fileObj.error 
        ? `<div class="enterprise-upload__file-error">${fileObj.error}</div>`
        : fileObj.uploaded 
          ? `<div class="enterprise-upload__file-success">✓ Uploaded</div>`
          : ''
      }
    `;
  }
  
  // Upload file
  async function uploadFile(fileObj) {
    uploading = true;
    
    try {
      if (onUpload) {
        // Custom upload handler
        const result = await onUpload(fileObj.file, (progress) => {
          fileObj.progress = progress;
          updateFileElement(fileObj);
        });
        fileObj.uploaded = true;
        fileObj.url = result.url;
      } else if (uploadUrl) {
        // Default upload to URL
        const formData = new FormData();
        formData.append('file', fileObj.file);
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            fileObj.progress = Math.round((e.loaded / e.total) * 100);
            updateFileElement(fileObj);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            fileObj.uploaded = true;
            fileObj.url = response.url;
            fileObj.progress = 100;
          } else {
            fileObj.error = 'Upload failed';
          }
          updateFileElement(fileObj);
        });
        
        xhr.addEventListener('error', () => {
          fileObj.error = 'Upload failed';
          updateFileElement(fileObj);
        });
        
        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      }
    } catch (err) {
      fileObj.error = err.message || 'Upload failed';
      updateFileElement(fileObj);
    } finally {
      uploading = false;
    }
  }
  
  // Remove file
  function removeFile(id) {
    const index = files.findIndex(f => f.id === id);
    if (index > -1) {
      files.splice(index, 1);
      const fileEl = filesList.querySelector(`[data-id="${id}"]`);
      if (fileEl) fileEl.remove();
      onChange?.(files);
    }
  }
  
  // Show error
  function showError(msg) {
    helper.textContent = msg;
    helper.classList.add('enterprise-upload__helper--error');
    setTimeout(() => {
      helper.textContent = helperText;
      helper.classList.remove('enterprise-upload__helper--error');
    }, 5000);
  }
  
  // Event listeners
  dropzone.addEventListener('click', () => {
    if (!disabled) fileInput.click();
  });
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      addFiles(e.target.files);
      fileInput.value = '';
    }
  });
  
  // Drag and drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
  
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => {
      dropzone.classList.add('enterprise-upload__dropzone--active');
    });
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => {
      dropzone.classList.remove('enterprise-upload__dropzone--active');
    });
  });
  
  dropzone.addEventListener('drop', (e) => {
    if (!disabled) {
      const droppedFiles = e.dataTransfer.files;
      addFiles(droppedFiles);
    }
  });
  
  filesList.addEventListener('click', (e) => {
    const btn = e.target.closest('.enterprise-upload__file-remove');
    if (btn) {
      const id = parseFloat(btn.dataset.id);
      removeFile(id);
    }
  });
  
  return {
    element: wrapper,
    getValue: () => files,
    getFiles: () => files.map(f => f.file),
    clear: () => {
      files = [];
      filesList.innerHTML = '';
      onChange?.(files);
    },
    setError: (msg) => {
      helper.textContent = msg;
      helper.classList.add('enterprise-upload__helper--error');
      container.classList.add('enterprise-upload--error');
    },
    clearError: () => {
      helper.textContent = helperText;
      helper.classList.remove('enterprise-upload__helper--error');
      container.classList.remove('enterprise-upload--error');
    }
  };
}
