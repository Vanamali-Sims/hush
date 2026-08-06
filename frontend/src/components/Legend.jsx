import { CautionIcon, DashIcon, LeafIcon } from './icons';

export function Legend({ threshold }) {
  return (
    <dl className="legend">
      <div>
        <dt>
          <span className="badge badge--low">
            <LeafIcon size={15} />
            LOW
          </span>
        </dt>
        <dd>Route average is at or below your limit of {threshold} people/min.</dd>
      </div>
      <div>
        <dt>
          <span className="badge badge--high">
            <CautionIcon size={15} />
            HIGH
          </span>
        </dt>
        <dd>Route average is above {threshold} people/min.</dd>
      </div>
      <div>
        <dt>
          <span className="flag">!</span>
        </dt>
        <dd>
          One spot on this route reads above your limit and more than double the
          route&rsquo;s own average.
        </dd>
      </div>
      <div>
        <dt>
          <span className="badge badge--nodata">
            <DashIcon size={15} />
            NO DATA
          </span>
        </dt>
        <dd>No sensor within 50 m of that part. Never silently counted as low.</dd>
      </div>
    </dl>
  );
}
