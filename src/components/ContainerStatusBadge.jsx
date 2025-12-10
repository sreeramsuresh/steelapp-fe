import PropTypes from 'prop-types';
import { Badge } from '@/components/ui/badge';

/**
 * ContainerStatusBadge - Display container status with color-coded badge
 * 
 * Status colors:
 * - BOOKED: gray
 * - IN_TRANSIT: blue
 * - ARRIVED: yellow
 * - CUSTOMS: orange
 * - CLEARED: green
 * - DELIVERED: purple
 */

const STATUS_CONFIG = {
  BOOKED: {
    label: 'Booked',
    className: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  IN_TRANSIT: {
    label: 'In Transit',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  ARRIVED: {
    label: 'Arrived',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  CUSTOMS: {
    label: 'Customs',
    className: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  CLEARED: {
    label: 'Cleared',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  DELIVERED: {
    label: 'Delivered',
    className: 'bg-purple-100 text-purple-800 border-purple-300',
  },
};

export function ContainerStatusBadge({ status, size = 'default' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.BOOKED;
  
  const sizeClasses = size === 'sm' 
    ? 'px-1.5 py-0.5 text-[10px]' 
    : 'px-2 py-1 text-xs';

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${sizeClasses} font-semibold border`}
    >
      {config.label}
    </Badge>
  );
}

ContainerStatusBadge.propTypes = {
  status: PropTypes.oneOf([
    'BOOKED',
    'IN_TRANSIT',
    'ARRIVED',
    'CUSTOMS',
    'CLEARED',
    'DELIVERED',
  ]),
  size: PropTypes.oneOf(['default', 'sm']),
};

export default ContainerStatusBadge;
