import React from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import { 
    CurrencyDollar, 
    Cart4, 
    GraphUpArrow, 
    ExclamationCircle,
    ArrowUpShort,
    ArrowDownShort
} from 'react-bootstrap-icons';

// Enhanced color palette
const colors = {
    primary: '#0d6efd',
    success: '#198754',
    warning: '#ffc107',
    danger: '#dc3545',
    muted: '#6c757d'
};

// Icons with background styling
const icons = {
    CurrencyDollar: (color) => (
        <div className="rounded-circle p-2" style={{ backgroundColor: `${colors[color]}15` }}>
            <CurrencyDollar size={24} color={colors[color]} />
        </div>
    ),
    Cart4: (color) => (
        <div className="rounded-circle p-2" style={{ backgroundColor: `${colors[color]}15` }}>
            <Cart4 size={24} color={colors[color]} />
        </div>
    ),
    GraphUpArrow: (color) => (
        <div className="rounded-circle p-2" style={{ backgroundColor: `${colors[color]}15` }}>
            <GraphUpArrow size={24} color={colors[color]} />
        </div>
    ),
    ExclamationCircle: (color) => (
        <div className="rounded-circle p-2" style={{ backgroundColor: `${colors[color]}15` }}>
            <ExclamationCircle size={24} color={colors[color]} />
        </div>
    )
};

// Single KPI Card Component
const KPICard = ({ title, value, icon, color, trend, trendValue }) => (
    <Card 
        className="h-100 shadow-sm border-0"
        style={{ 
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 .5rem 1rem rgba(0,0,0,.15)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 .125rem .25rem rgba(0,0,0,.075)';
        }}
    >
        <Card.Body className="p-4">
            {/* Icon and Trend Badge Row */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                {icons[icon](color)}
                {trend && (
                    <Badge 
                        bg={trend === 'up' ? 'success' : 'danger'} 
                        className="d-flex align-items-center gap-1 px-2 py-1"
                        style={{ fontSize: '0.8rem' }}
                    >
                        {trend === 'up' ? 
                            <ArrowUpShort size={16} /> : 
                            <ArrowDownShort size={16} />
                        }
                        {trendValue}%
                    </Badge>
                )}
            </div>
            
            {/* Value and Title */}
            <h3 className="mb-2 fw-bold" style={{ color: colors[color], fontSize: '1.75rem' }}>
                {value || 0}
            </h3>
            <p className="text-muted mb-0" style={{ 
                fontSize: '0.875rem', 
                letterSpacing: '0.5px',
                fontWeight: '500'
            }}>
                {title}
            </p>
        </Card.Body>
    </Card>
);

// Main KPI Section Component
const KPISection = ({ kpiData }) => (
    <Row className="g-4 mb-4">
        {kpiData.map((card, index) => (
            <Col key={index} xs={12} sm={6} xl={3}>
                <KPICard
                    title={card.title}
                    value={card.value}
                    icon={card.icon}
                    color={card.color}
                    trend={card.trend}
                    trendValue={card.trendValue}
                />
            </Col>
        ))}
    </Row>
);

export default KPISection;
