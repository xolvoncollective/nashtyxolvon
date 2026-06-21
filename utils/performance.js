// Performance Monitoring Helper
// Lightweight performance measurement utilities

const Performance = {
  marks: {},
  measures: [],
  
  /**
   * Start measuring performance for a named operation
   * @param {string} name - Unique name for the measurement
   */
  start(name) {
    this.marks[name] = performance.now();
  },
  
  /**
   * End measurement and return duration
   * @param {string} name - Name of the measurement to end
   * @returns {number} Duration in milliseconds
   */
  end(name) {
    if (!this.marks[name]) {
      console.warn(`[Performance] No mark found for: ${name}`);
      return 0;
    }
    const duration = performance.now() - this.marks[name];
    delete this.marks[name];
    
    // Store measurement
    this.measures.push({
      name,
      duration,
      timestamp: Date.now()
    });
    
    return duration;
  },
  
  /**
   * Measure synchronous function execution
   * @param {string} name - Measurement name
   * @param {Function} fn - Function to measure
   * @returns {*} Function result
   */
  measure(name, fn) {
    this.start(name);
    try {
      const result = fn();
      const duration = this.end(name);
      this._log(name, duration);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  },
  
  /**
   * Measure asynchronous function execution
   * @param {string} name - Measurement name
   * @param {Function} fn - Async function to measure
   * @returns {Promise<*>} Function result
   */
  async measureAsync(name, fn) {
    this.start(name);
    try {
      const result = await fn();
      const duration = this.end(name);
      this._log(name, duration);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  },
  
  /**
   * Get all measurements
   * @returns {Array} Array of measurement objects
   */
  getAll() {
    return [...this.measures];
  },
  
  /**
   * Get measurements by name
   * @param {string} name - Measurement name to filter by
   * @returns {Array} Filtered measurements
   */
  getByName(name) {
    return this.measures.filter(m => m.name === name);
  },
  
  /**
   * Get average duration for a named measurement
   * @param {string} name - Measurement name
   * @returns {number} Average duration in ms
   */
  getAverage(name) {
    const filtered = this.getByName(name);
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  },
  
  /**
   * Clear all measurements
   */
  clear() {
    this.marks = {};
    this.measures = [];
  },
  
  /**
   * Log performance measurement
   * @private
   */
  _log(name, duration) {
    const color = duration < 100 ? 'color: green' : duration < 500 ? 'color: orange' : 'color: red';
    console.log(`%c⏱️ ${name}: ${duration.toFixed(2)}ms`, color);
  },
  
  /**
   * Create performance report
   * @returns {string} Formatted report
   */
  report() {
    if (this.measures.length === 0) {
      return 'No measurements recorded';
    }
    
    // Group by name
    const grouped = {};
    this.measures.forEach(m => {
      if (!grouped[m.name]) {
        grouped[m.name] = [];
      }
      grouped[m.name].push(m.duration);
    });
    
    // Build report
    let report = '\n📊 Performance Report\n';
    report += '─'.repeat(50) + '\n';
    
    Object.keys(grouped).forEach(name => {
      const durations = grouped[name];
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      
      report += `${name}:\n`;
      report += `  Calls: ${durations.length}\n`;
      report += `  Avg: ${avg.toFixed(2)}ms\n`;
      report += `  Min: ${min.toFixed(2)}ms\n`;
      report += `  Max: ${max.toFixed(2)}ms\n`;
      report += '\n';
    });
    
    return report;
  }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.Performance = Performance;
  
  // Global convenience functions
  window.perf = {
    start: (name) => Performance.start(name),
    end: (name) => Performance.end(name),
    report: () => console.log(Performance.report())
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Performance;
}
