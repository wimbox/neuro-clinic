/**
 * Financial Charts and Analytics
 * Provides data visualization for clinic finances
 */
class FinancialCharts {
    constructor() {
        this.chartColors = {
            income: '#10b981',
            expense: '#ef4444',
            profit: '#3b82f6',
            accent: '#00eaff'
        };
    }

    /**
     * Get financial data grouped by month
     */
    getMonthlyData() {
        const finances = syncManager.getFinances();
        const monthlyData = {};

        finances.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    income: 0,
                    expense: 0,
                    profit: 0,
                    count: 0
                };
            }

            if (transaction.type === 'income') {
                monthlyData[monthKey].income += transaction.amount;
            } else {
                monthlyData[monthKey].expense += transaction.amount;
            }
            monthlyData[monthKey].profit = monthlyData[monthKey].income - monthlyData[monthKey].expense;
            monthlyData[monthKey].count++;
        });

        return monthlyData;
    }

    /**
     * Get last N months data
     */
    getLastMonths(count = 6) {
        const monthlyData = this.getMonthlyData();
        const months = Object.keys(monthlyData).sort().slice(-count);

        return months.map(month => ({
            month: this.formatMonthLabel(month),
            monthKey: month,
            ...monthlyData[month]
        }));
    }

    /**
     * Format month key to Arabic label
     */
    formatMonthLabel(monthKey) {
        const [year, month] = monthKey.split('-');
        const monthNames = [
            'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    }

    /**
     * Render line chart for revenue trends
     */
    renderRevenueChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const data = this.getLastMonths(6);
        if (data.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">لا توجد بيانات مالية لعرضها</p>';
            return;
        }

        const maxValue = Math.max(...data.map(d => Math.max(d.income, d.expense)));
        const chartHeight = 250;

        let html = `
            <div style="background: rgba(0,0,0,0.2); border-radius: 15px; padding: 25px; border: 1px solid rgba(0,234,255,0.1);">
                <h3 style="color: #00eaff; margin-bottom: 20px; text-align: center; font-size: 1.3rem;">
                    <i class="fa-solid fa-chart-line"></i> اتجاهات الإيرادات والمصروفات
                </h3>
                
                <div style="position: relative; height: ${chartHeight}px; display: flex; align-items: flex-end; justify-content: space-around; margin-bottom: 15px;">
        `;

        // Draw bars
        data.forEach((item, index) => {
            const incomeHeight = (item.income / maxValue) * chartHeight;
            const expenseHeight = (item.expense / maxValue) * chartHeight;

            html += `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 5px;">
                    <div style="display: flex; gap: 8px; align-items: flex-end;">
                        <div style="width: 35px; height: ${incomeHeight}px; background: linear-gradient(to top, ${this.chartColors.income}, rgba(16,185,129,0.6)); border-radius: 8px 8px 0 0; position: relative; transition: all 0.3s;" 
                            title="إيرادات: ${item.income} جنيه">
                            <span style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); color: ${this.chartColors.income}; font-size: 0.75rem; font-weight: 700; white-space: nowrap;">${item.income}</span>
                        </div>
                        <div style="width: 35px; height: ${expenseHeight}px; background: linear-gradient(to top, ${this.chartColors.expense}, rgba(239,68,68,0.6)); border-radius: 8px 8px 0 0; position: relative; transition: all 0.3s;"
                            title="مصروفات: ${item.expense} جنيه">
                            <span style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); color: ${this.chartColors.expense}; font-size: 0.75rem; font-weight: 700; white-space: nowrap;">${item.expense}</span>
                        </div>
                    </div>
                    <span style="color: #94a3b8; font-size: 0.75rem; transform: rotate(-15deg); margin-top: 8px;">${item.month}</span>
                </div>
            `;
        });

        html += `
                </div>
                
                <div style="display: flex; justify-content: center; gap: 30px; margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 20px; height: 20px; background: ${this.chartColors.income}; border-radius: 4px;"></div>
                        <span style="color: #e2e8f0; font-size: 0.9rem;">الإيرادات</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 20px; height: 20px; background: ${this.chartColors.expense}; border-radius: 4px;"></div>
                        <span style="color: #e2e8f0; font-size: 0.9rem;">المصروفات</span>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Render pie chart for expense breakdown
     */
    renderExpenseBreakdown(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const finances = syncManager.getFinances();
        const expenses = finances.filter(f => f.type === 'expense');

        if (expenses.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">لا توجد مصروفات لعرضها</p>';
            return;
        }

        // Group by description
        const breakdown = {};
        expenses.forEach(exp => {
            const category = exp.description || 'غير مصنف';
            if (!breakdown[category]) {
                breakdown[category] = 0;
            }
            breakdown[category] += exp.amount;
        });

        const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
        const categories = Object.entries(breakdown)
            .map(([name, amount]) => ({
                name,
                amount,
                percentage: ((amount / total) * 100).toFixed(1)
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5); // Top 5

        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

        let html = `
            <div style="background: rgba(0,0,0,0.2); border-radius: 15px; padding: 25px; border: 1px solid rgba(0,234,255,0.1);">
                <h3 style="color: #00eaff; margin-bottom: 20px; text-align: center; font-size: 1.3rem;">
                    <i class="fa-solid fa-chart-pie"></i> توزيع المصروفات
                </h3>
                
                <div style="display: flex; gap: 30px; align-items: center; justify-content: center;">
                    <div style="position: relative; width: 200px; height: 200px;">
                        <svg viewBox="0 0 100 100" style="transform: rotate(-90deg);">
        `;

        let currentAngle = 0;
        categories.forEach((cat, index) => {
            const angle = (cat.percentage / 100) * 360;
            const radius = 45;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (angle / 360) * circumference;

            html += `
                <circle cx="50" cy="50" r="${radius}" 
                    fill="none" 
                    stroke="${colors[index]}" 
                    stroke-width="10"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${offset}"
                    style="transform: rotate(${currentAngle}deg); transform-origin: 50% 50%;"
                    opacity="0.9" />
            `;
            currentAngle += angle;
        });

        html += `
                        </svg>
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                            <div style="color: #00eaff; font-size: 1.5rem; font-weight: 800;">${total}</div>
                            <div style="color: #94a3b8; font-size: 0.75rem;">جنيه</div>
                        </div>
                    </div>
                    
                    <div style="flex: 1;">
        `;

        categories.forEach((cat, index) => {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 15px; height: 15px; background: ${colors[index]}; border-radius: 3px;"></div>
                        <span style="color: #e2e8f0; font-size: 0.9rem;">${cat.name}</span>
                    </div>
                    <div style="text-align: left;">
                        <div style="color: #fff; font-weight: 700;">${cat.amount} EGP</div>
                        <div style="color: #64748b; font-size: 0.75rem;">${cat.percentage}%</div>
                    </div>
                </div>
            `;
        });

        html += `
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Render statistics summary
     */
    renderFinancialSummary(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const data = this.getLastMonths(1)[0]; // Current month
        if (!data) {
            container.innerHTML = '<p style="text-align: center; color: #64748b;">لا توجد بيانات هذا الشهر</p>';
            return;
        }

        const profit = data.income - data.expense;
        const profitColor = profit >= 0 ? '#10b981' : '#ef4444';

        const html = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                    <i class="fa-solid fa-arrow-trend-up" style="color: #10b981; font-size: 2rem; margin-bottom: 10px;"></i>
                    <h4 style="color: #10b981; font-size: 1.8rem; margin: 10px 0;">${data.income} EGP</h4>
                    <p style="color: #94a3b8; font-size: 0.9rem;">إجمالي الإيرادات</p>
                </div>
                
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                    <i class="fa-solid fa-arrow-trend-down" style="color: #ef4444; font-size: 2rem; margin-bottom: 10px;"></i>
                    <h4 style="color: #ef4444; font-size: 1.8rem; margin: 10px 0;">${data.expense} EGP</h4>
                    <p style="color: #94a3b8; font-size: 0.9rem;">إجمالي المصروفات</p>
                </div>
                
                <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                    <i class="fa-solid fa-chart-line" style="color: ${profitColor}; font-size: 2rem; margin-bottom: 10px;"></i>
                    <h4 style="color: ${profitColor}; font-size: 1.8rem; margin: 10px 0;">${profit} EGP</h4>
                    <p style="color: #94a3b8; font-size: 0.9rem;">صافي الربح</p>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }
}

// Global instance
window.financialCharts = new FinancialCharts();
